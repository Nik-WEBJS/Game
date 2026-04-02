import { GameState, HostingMode, InfrastructureCapacity, InfrastructureServerType, InfrastructureState } from '../types';
import { BALANCE } from '../config/balance';
import { canConsumeProductionResources, consumeProductionResources } from './production';
import { isManagerBusyWithISO } from './iso';

function clamp(min: number, max: number, value: number): number {
  return Math.max(min, Math.min(max, value));
}

function capValues(capacity: InfrastructureCapacity): number {
  return capacity.web + capacity.db + capacity.cache;
}

function unique(values: string[]): string[] {
  return Array.from(new Set(values));
}

type CloudTier = InfrastructureState['cloudTier'];

function getCloudTierConfig(tier: CloudTier) {
  return BALANCE.infrastructure.cloud.tiers[tier - 1] ?? BALANCE.infrastructure.cloud.tiers[0];
}

function getCloudAutoscaleConfig() {
  return BALANCE.infrastructure.cloud.autoscale;
}

function getCurrentCapacity(state: GameState): InfrastructureCapacity {
  const infra = state.business.infrastructure;
  if (infra.hostingMode === 'cloud') {
    return { ...getCloudTierConfig(infra.cloudTier).capacity };
  }
  return { ...infra.ownCapacity };
}

function getDemandFromLiveProduct(state: GameState): InfrastructureCapacity {
  const live = state.business.liveProduct;
  if (!live) return { web: 0, db: 0, cache: 0 };
  const model = BALANCE.infrastructure.demandModel;
  return {
    web: Math.max(
      model.minimum.web,
      live.metrics.traffic / model.webTrafficDivisor + live.metrics.activeUsers / model.webActiveDivisor,
    ),
    db: Math.max(
      model.minimum.db,
      live.metrics.activeUsers / model.dbActiveDivisor + live.metrics.payingUsers / model.dbPayingDivisor,
    ),
    cache: Math.max(
      model.minimum.cache,
      live.metrics.traffic / model.cacheTrafficDivisor + live.metrics.activeUsers / model.cacheActiveDivisor,
    ),
  };
}

function getUtilization(demand: InfrastructureCapacity, capacity: InfrastructureCapacity): InfrastructureCapacity {
  return {
    web: demand.web / Math.max(1, capacity.web),
    db: demand.db / Math.max(1, capacity.db),
    cache: demand.cache / Math.max(1, capacity.cache),
  };
}

export function getCloudTierUpgradeCost(state: GameState): number | null {
  const tier = state.business.infrastructure.cloudTier;
  const cost = (BALANCE.infrastructure.cloud.upgradeCost as readonly number[])[tier];
  return typeof cost === 'number' ? cost : null;
}

export function setHostingMode(state: GameState, mode: HostingMode): GameState {
  const infra = state.business.infrastructure;
  if (infra.hostingMode === mode) return state;
  return {
    ...state,
    business: {
      ...state.business,
      infrastructure: { ...infra, hostingMode: mode },
    },
    logs: [
      ...state.logs,
      {
        week: state.player.currentWeek,
        type: 'info',
        message: `Hosting mode switched to ${mode === 'cloud' ? 'cloud' : 'own infrastructure'}.`,
      },
    ],
  };
}

export function upgradeCloudTier(state: GameState): GameState {
  const infra = state.business.infrastructure;
  const maxTier = BALANCE.infrastructure.cloud.tiers.length as CloudTier;
  if (infra.cloudTier >= maxTier) return state;
  const cost = getCloudTierUpgradeCost(state);
  if (cost == null) return state;
  const nextTier = (infra.cloudTier + 1) as CloudTier;
  return {
    ...state,
    player: { ...state.player, money: state.player.money - cost },
    business: {
      ...state.business,
      infrastructure: { ...infra, cloudTier: nextTier },
    },
    logs: [
      ...state.logs,
      {
        week: state.player.currentWeek,
        type: 'success',
        message: `Cloud tier upgraded: T${infra.cloudTier} -> T${nextTier}.`,
      },
    ],
  };
}

export function getOwnCapacityUpgradeCost(
  state: GameState,
  serverType: InfrastructureServerType,
): { money: number; ops: number; step: number } {
  const infra = state.business.infrastructure;
  const baseCap = BALANCE.infrastructure.own.baseCapacity[serverType];
  const current = infra.ownCapacity[serverType];
  const step = BALANCE.infrastructure.own.expandStep[serverType];
  const progression = Math.max(0, (current - baseCap) / Math.max(1, step));
  const money = Math.round(BALANCE.infrastructure.own.expandMoneyCost[serverType] * (1 + progression * 0.22));
  const ops = Math.round(BALANCE.infrastructure.own.expandOpsCost[serverType] * (1 + progression * 0.18));
  return { money, ops, step };
}

export function canUpgradeOwnCapacity(state: GameState, serverType: InfrastructureServerType): boolean {
  if (state.business.infrastructure.hostingMode !== 'own') return false;
  const cost = getOwnCapacityUpgradeCost(state, serverType);
  return canConsumeProductionResources(state, { ops: cost.ops });
}

export function upgradeOwnCapacity(state: GameState, serverType: InfrastructureServerType): GameState {
  if (state.business.infrastructure.hostingMode !== 'own') return state;
  if (!canUpgradeOwnCapacity(state, serverType)) return state;
  const infra = state.business.infrastructure;
  const cost = getOwnCapacityUpgradeCost(state, serverType);
  let nextState: GameState = {
    ...state,
    player: { ...state.player, money: state.player.money - cost.money },
    business: {
      ...state.business,
      infrastructure: {
        ...infra,
        ownCapacity: {
          ...infra.ownCapacity,
          [serverType]: infra.ownCapacity[serverType] + cost.step,
        },
      },
    },
  };
  nextState = consumeProductionResources(nextState, { ops: cost.ops });
  return {
    ...nextState,
    logs: [
      ...nextState.logs,
      {
        week: state.player.currentWeek,
        type: 'info',
        message: `Own ${serverType} capacity expanded by ${cost.step} (${cost.ops} ops).`,
      },
    ],
  };
}

export function runSupportBurst(state: GameState, requestedTickets = 40): GameState {
  const support = state.business.support;
  if (support.openTickets <= 0) return state;
  const burstCfg = BALANCE.support.burst;
  const target = Math.max(1, Math.min(burstCfg.maxTicketsPerAction, Math.round(requestedTickets)));
  const supportInventory = state.business.production.inventory.support;
  const maxBySupport = Math.floor(supportInventory / burstCfg.supportUnitsPerTicket);
  const resolved = Math.min(support.openTickets, target, maxBySupport);
  if (resolved <= 0) return state;

  const moneyCost = Math.round(resolved * burstCfg.moneyCostPerTicket);
  const supportUnits = Math.ceil(resolved * burstCfg.supportUnitsPerTicket);

  let nextState: GameState = {
    ...state,
    player: { ...state.player, money: state.player.money - moneyCost },
    business: {
      ...state.business,
      support: {
        ...support,
        openTickets: Math.max(0, support.openTickets - resolved),
        resolvedLastWeek: support.resolvedLastWeek + resolved,
        backlogPressure: clamp(0, 1, Math.max(0, support.openTickets - resolved) / 100),
      },
    },
  };
  nextState = consumeProductionResources(nextState, { support: supportUnits });

  return {
    ...nextState,
    logs: [
      ...nextState.logs,
      {
        week: state.player.currentWeek,
        type: 'success',
        message: `Support burst resolved ${resolved} tickets (-${supportUnits} support units).`,
      },
    ],
  };
}

export function getHostingWeeklyCost(state: GameState): number {
  const infra = state.business.infrastructure;
  const load = Math.max(0, infra.lastWeek.load);
  if (infra.hostingMode === 'cloud') {
    const tierCfg = getCloudTierConfig(infra.cloudTier);
    const autoscaleCfg = getCloudAutoscaleConfig();
    const autoscaleCost = infra.cloudTier >= autoscaleCfg.enabledFromTier
      ? infra.lastWeek.autoscaleBoost * autoscaleCfg.costPerBoostShare
      : 0;
    return tierCfg.baseCost + Math.max(0, load - 0.5) * tierCfg.variableCostPerLoad + autoscaleCost;
  }

  const cap = capValues(infra.ownCapacity);
  const maintenance = cap * BALANCE.infrastructure.own.maintenanceCostPerUnit;
  const loadSurcharge = Math.max(0, load - 0.8) * 480;
  return maintenance + loadSurcharge;
}

export function tickInfrastructureAndSupport(state: GameState): GameState {
  const live = state.business.liveProduct;
  if (!live) return state;

  const infra = state.business.infrastructure;
  const support = state.business.support;
  const demand = getDemandFromLiveProduct(state);
  const baseCapacity = getCurrentCapacity(state);
  let capacity = baseCapacity;
  let utilization = getUtilization(demand, capacity);
  let load = Math.max(utilization.web, utilization.db, utilization.cache);

  let autoscaleBoost = 0;
  const autoscaleCfg = getCloudAutoscaleConfig();
  if (
    infra.hostingMode === 'cloud'
    && infra.cloudTier >= autoscaleCfg.enabledFromTier
    && load > autoscaleCfg.triggerLoad
  ) {
    autoscaleBoost = clamp(
      0,
      autoscaleCfg.maxBoost,
      (load - autoscaleCfg.triggerLoad) * autoscaleCfg.boostPerLoad,
    );
    capacity = {
      web: baseCapacity.web * (1 + autoscaleBoost),
      db: baseCapacity.db * (1 + autoscaleBoost),
      cache: baseCapacity.cache * (1 + autoscaleBoost),
    };
    utilization = getUtilization(demand, capacity);
    load = Math.max(utilization.web, utilization.db, utilization.cache);
  }

  const latencyCfg = BALANCE.infrastructure.latency;
  const overload = Math.max(0, load - 1);
  let latencyMs = latencyCfg.baseMs + load * latencyCfg.perLoadMs + overload * overload * latencyCfg.overloadQuadraticMs;

  const riskCfg = BALANCE.infrastructure.risk;
  const baseRisk = infra.hostingMode === 'own' ? riskCfg.ownHostingBaseRisk : riskCfg.cloudBaseRisk;
  let outageRisk = clamp(
    0,
    0.9,
    baseRisk + Math.max(0, load - 0.9) * riskCfg.overloadRiskScale + state.business.metrics.risk * riskCfg.businessRiskScale,
  );
  if (infra.hostingMode === 'cloud') outageRisk *= riskCfg.cloudRiskReduction;
  const outage = Math.random() < outageRisk;
  if (outage) latencyMs += latencyCfg.outageExtraMs;

  const degCfg = BALANCE.infrastructure.degradation;
  const infraDegradation = clamp(
    0,
    degCfg.maxDegradation,
    overload * degCfg.overloadScale
      + Math.max(0, latencyMs - degCfg.latencyThresholdMs) * degCfg.latencyScale
      + (outage ? degCfg.outagePenalty : 0),
  );

  const ticketCfg = BALANCE.support.ticketGeneration;
  const generatedTickets = Math.max(
    0,
    Math.round(
      live.metrics.activeUsers * ticketCfg.basePerActiveUser
      + Math.max(0, load - 0.9) * ticketCfg.overloadScale
      + live.metrics.activeUsers * live.metrics.churn * ticketCfg.churnScale
      + (outage ? ticketCfg.outageSpike : 0),
    ),
  );

  const managerBusy = isManagerBusyWithISO(state);
  const teamCapacityByRole = BALANCE.support.teamCapacityByRole;
  const teamEff = BALANCE.support.teamEfficiency;
  const teamSupportCapacity = state.business.team
    .filter(member => member.status === 'office')
    .reduce((sum, member) => {
      if (managerBusy && member.role === 'manager') return sum;
      const base = teamCapacityByRole[member.role];
      const efficiency = clamp(
        teamEff.min,
        teamEff.max,
        teamEff.base
          + member.experience / teamEff.experienceDivisor
          + member.morale / teamEff.moraleDivisor
          - member.burnout / teamEff.burnoutDivisor,
      );
      return sum + base * efficiency;
    }, 0);

  const inventoryCfg = BALANCE.support.inventorySupport;
  const supportInventory = state.business.production.inventory.support;
  const maxInventoryUnits = Math.floor(supportInventory * inventoryCfg.maxSharePerWeek);
  const inventoryTicketCapacity = maxInventoryUnits * inventoryCfg.ticketsPerUnit;

  const incomingTickets = support.openTickets + generatedTickets;
  const resolvedTickets = Math.min(incomingTickets, Math.floor(teamSupportCapacity + inventoryTicketCapacity));
  const usedInventoryTickets = Math.max(0, resolvedTickets - Math.floor(teamSupportCapacity));
  const supportUnitsUsed = Math.min(maxInventoryUnits, Math.ceil(usedInventoryTickets / inventoryCfg.ticketsPerUnit));

  let nextState = state;
  if (supportUnitsUsed > 0) {
    nextState = consumeProductionResources(nextState, { support: supportUnitsUsed });
  }

  const queueDynamics = BALANCE.support.queueDynamics;
  const openTickets = Math.max(0, incomingTickets - resolvedTickets);
  const avgWaitWeeks = openTickets <= 0
    ? support.avgWaitWeeks * queueDynamics.waitDecayWhenClear
    : Math.min(
      10,
      support.avgWaitWeeks * queueDynamics.waitCarry
        + openTickets / Math.max(1, resolvedTickets * queueDynamics.waitRatioDivisor),
    );
  const backlogPressure = clamp(
    0,
    1,
    openTickets / Math.max(1, resolvedTickets * queueDynamics.backlogResolvedScale + queueDynamics.backlogBuffer),
  );

  const supportPenaltyCfg = BALANCE.support.penalty;
  const supportPenalty = clamp(
    0,
    supportPenaltyCfg.maxPenalty,
    backlogPressure * supportPenaltyCfg.backlogScale
      + Math.max(0, avgWaitWeeks - support.slaTargetWeeks) * supportPenaltyCfg.waitBeyondSlaScale,
  );

  const totalDegradation = clamp(0, degCfg.maxDegradation, infraDegradation + supportPenalty);
  const impact = degCfg.productImpact;

  const before = live.metrics;
  const updatedTraffic = Math.max(
    80,
    Math.round(before.traffic * (1 - totalDegradation * impact.trafficScale - (outage ? impact.outageTrafficShock : 0))),
  );
  const updatedConversion = clamp(0.02, 0.45, before.conversion - totalDegradation * impact.conversionScale);
  const updatedChurn = clamp(0.01, 0.45, before.churn + totalDegradation * impact.churnScale);
  const updatedSatisfaction = clamp(0.1, 0.99, before.satisfaction - totalDegradation * impact.satisfactionScale);
  const updatedSignups = Math.max(0, Math.round(updatedTraffic * updatedConversion));
  const outageActiveShock = outage ? before.activeUsers * impact.outageActiveShock : 0;
  const updatedActiveUsers = Math.max(
    0,
    Math.round(before.activeUsers - outageActiveShock - before.activeUsers * totalDegradation * impact.activeScale),
  );
  const outagePayingShock = outage ? before.payingUsers * impact.outagePayingShock : 0;
  const updatedPayingUsers = Math.min(
    updatedActiveUsers,
    Math.max(0, Math.round(before.payingUsers - outagePayingShock - before.payingUsers * totalDegradation * impact.payingScale)),
  );

  const deltaTraffic = updatedTraffic - before.traffic;
  const deltaSignups = updatedSignups - before.signups;
  const deltaActive = updatedActiveUsers - before.activeUsers;
  const deltaPaying = updatedPayingUsers - before.payingUsers;
  const deltaSatisfaction = updatedSatisfaction - before.satisfaction;
  const deltaConversion = updatedConversion - before.conversion;
  const deltaChurn = updatedChurn - before.churn;

  const existingLastWeek = live.lastWeek;
  const extraNegatives: string[] = [];
  const extraBottlenecks: string[] = [];
  if (load > 1) {
    extraNegatives.push('Infrastructure load pressure');
    extraBottlenecks.push('Hosting capacity bottleneck (web/db/cache)');
  }
  if (outage) {
    extraNegatives.push('Service outage incident');
    extraBottlenecks.push('Outage impacted user experience');
  }
  if (backlogPressure > 0.3) {
    extraNegatives.push('Support queue pressure');
    extraBottlenecks.push('Support backlog is rising');
  }
  if (avgWaitWeeks > support.slaTargetWeeks) {
    extraBottlenecks.push('Support SLA target exceeded');
  }

  const nextLiveProduct = {
    ...live,
    metrics: {
      traffic: updatedTraffic,
      signups: updatedSignups,
      activeUsers: updatedActiveUsers,
      payingUsers: updatedPayingUsers,
      satisfaction: updatedSatisfaction,
      conversion: updatedConversion,
      churn: updatedChurn,
    },
    lastWeek: {
      ...existingLastWeek,
      topNegativeFactors: unique([...extraNegatives, ...existingLastWeek.topNegativeFactors]).slice(0, 3),
      bottlenecks: unique([...extraBottlenecks, ...existingLastWeek.bottlenecks]).slice(0, 5),
      deltas: {
        traffic: existingLastWeek.deltas.traffic + deltaTraffic,
        signups: existingLastWeek.deltas.signups + deltaSignups,
        activeUsers: existingLastWeek.deltas.activeUsers + deltaActive,
        payingUsers: existingLastWeek.deltas.payingUsers + deltaPaying,
        satisfaction: existingLastWeek.deltas.satisfaction + deltaSatisfaction,
        conversion: existingLastWeek.deltas.conversion + deltaConversion,
        churn: existingLastWeek.deltas.churn + deltaChurn,
      },
    },
  };

  const nextInfrastructure = {
    ...infra,
    lastWeek: {
      demand,
      capacity,
      utilization,
      load,
      autoscaleBoost,
      latencyMs: Math.round(latencyMs),
      outageRisk,
      outage,
      degradation: totalDegradation,
    },
  };

  const nextSupport = {
    ...support,
    openTickets,
    generatedLastWeek: generatedTickets,
    resolvedLastWeek: resolvedTickets,
    avgWaitWeeks,
    backlogPressure,
  };

  const logs = [...nextState.logs];
  if (outage) {
    logs.push({
      week: state.player.currentWeek,
      type: 'warning',
      message: `Service outage: latency ${Math.round(latencyMs)}ms, load ${(load * 100).toFixed(0)}%.`,
    });
  } else if (load > 1.05) {
    logs.push({
      week: state.player.currentWeek,
      type: 'warning',
      message: `Hosting overload: load ${(load * 100).toFixed(0)}%, latency ${Math.round(latencyMs)}ms.`,
    });
  }
  if (autoscaleBoost > 0.01) {
    logs.push({
      week: state.player.currentWeek,
      type: 'info',
      message: `Cloud autoscale activated: +${Math.round(autoscaleBoost * 100)}% burst capacity.`,
    });
  }
  if (openTickets > 120) {
    logs.push({
      week: state.player.currentWeek,
      type: 'warning',
      message: `Support backlog is high: ${openTickets} open tickets.`,
    });
  }

  return {
    ...nextState,
    business: {
      ...nextState.business,
      liveProduct: nextLiveProduct,
      infrastructure: nextInfrastructure,
      support: nextSupport,
    },
    logs,
  };
}
