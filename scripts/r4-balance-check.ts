import { GameState, TeamMember, TeamRole } from '../src/game/types';
import {
  MARKETS,
  MONETIZATIONS,
  NICHES,
  PRODUCTS,
  ROLE_SALARIES,
  TECHNOLOGIES,
  createISO9001,
} from '../src/game/data';
import { NICHE_VARIANTS, BUSINESS_STYLES, createTechTree, generateMarketPool } from '../src/game/data-advanced';
import { createInitialCampaignState, createInitialCompetitionState } from '../src/game/data-competition';
import { createInitialCorporateState } from '../src/game/data-corporate';
import { BALANCE } from '../src/game/config/balance';
import { createInitialInfrastructureState, createInitialSupportState } from '../src/game/data-infrastructure';
import { createInitialLiveProduct } from '../src/game/data-product';
import { createInitialProductionState } from '../src/game/data-production';
import { createInitialProduct } from '../src/game/engines/product';
import { enqueueProduction } from '../src/game/engines/production';
import { simulateWeek } from '../src/game/engines/simulation';
import {
  canInstallFeature,
  canUpgradeFeature,
  installFeature,
  upgradeFeature,
  upgradeFeatureSlots,
} from '../src/game/engines/live-product';
import { canHire, hireMember } from '../src/game/engines/team';
import { runSupportBurst, upgradeCloudTier } from '../src/game/engines/infrastructure-support';
import { canExecuteMnaAction, executeMnaAction } from '../src/game/engines/competition';

type ScenarioMode = 'passive' | 'active';

interface Scenario {
  name: string;
  weeks: number;
  seed: number;
  mode: ScenarioMode;
}

interface ScenarioReport {
  scenario: Scenario;
  endWeek: number;
  money: number;
  reputation: number;
  activeUsers: number;
  payingUsers: number;
  satisfaction: number;
  churn: number;
  rank: number;
  marketShare: number;
  marketPressure: number;
  maxLoad: number;
  maxPressure: number;
  maxOpenTickets: number;
  minSatisfaction: number;
  completedMilestones: number;
  usedMna: boolean;
  warnings: string[];
}

interface EvaluationBase {
  mode: ScenarioMode;
  marketPressure: number;
  maxPressure: number;
  satisfaction: number;
  minSatisfaction: number;
  maxLoad: number;
  maxOpenTickets: number;
  activeUsers: number;
  completedMilestones: number;
}

function createMember(id: string, role: TeamRole, experience: number, talent: number): TeamMember {
  return {
    id,
    role,
    name: `${role}_${id}`,
    salary: ROLE_SALARIES[role],
    level: 1,
    experience,
    burnout: 5,
    morale: 75,
    talent,
    burnoutResistance: 0.35,
    trait: null,
    zoneId: null,
    deskId: null,
    status: 'office',
    freelanceTask: null,
    workProgress: 0,
    workCyclesCompleted: 0,
  };
}

function createBalanceState(): GameState {
  const product = createInitialProduct('saas_platform', 'SaaS Platform', 'subscription');
  const liveProduct = createInitialLiveProduct('saas_platform');

  return {
    saveVersion: BALANCE.saveVersion,
    player: {
      money: BALANCE.start.money,
      reputation: Math.max(25, BALANCE.start.reputation),
      experience: 0,
      unlockedNiches: NICHES.map(n => n.id),
      unlockedProducts: PRODUCTS.map(p => p.id),
      unlockedTechnologies: TECHNOLOGIES.map(t => t.id),
      currentWeek: 1,
      gameSpeed: 1,
      weekProgress: 0,
      totalTimePlayed: 0,
    },
    business: {
      companyName: 'R4 Balance Co',
      logoId: 'rocket',
      office: {
        level: 1,
        wallMaterials: { back: 'concrete', left: 'concrete', right: 'concrete' },
      },
      nicheId: 'fintech',
      nicheVariantId: null,
      productId: 'saas_platform',
      monetizationId: 'subscription',
      styleId: null,
      technologies: ['cloud_infra'],
      marketId: 'domestic',
      team: [
        createMember('m1', 'developer', 35, 0.5),
        createMember('m2', 'marketing', 30, 0.4),
        createMember('m3', 'manager', 25, 0.35),
      ],
      isoStandards: [createISO9001()],
      metrics: {
        revenue: 0,
        costs: 0,
        profit: 0,
        risk: 0.1,
        quality: 0,
        demand: 0,
        growthRate: 0,
        teamEfficiency: 0.5,
      },
      companyProducts: [product],
      techTree: createTechTree(),
      furniture: [],
      employeeMarket: generateMarketPool(5, 10),
      marketRefreshWeek: 0,
      liveProduct,
      production: createInitialProductionState(),
      infrastructure: createInitialInfrastructureState(),
      support: createInitialSupportState(),
      competition: createInitialCompetitionState('fintech'),
      campaign: createInitialCampaignState(),
      corporate: createInitialCorporateState(),
    },
    phase: 'playing',
    logs: [{ week: 1, message: 'R4 balance scenario start', type: 'info' }],
    activeEvents: [],
    availableNiches: NICHES,
    availableProducts: PRODUCTS,
    availableTechnologies: TECHNOLOGIES,
    availableMarkets: MARKETS,
    availableMonetizations: MONETIZATIONS,
    availableNicheVariants: NICHE_VARIANTS,
    availableBusinessStyles: BUSINESS_STYLES,
    weekHistory: [],
  };
}

function withSeededRandom<T>(seed: number, fn: () => T): T {
  const originalRandom = Math.random;
  let s = seed >>> 0;
  if (s === 0) s = 1;
  Math.random = () => {
    s = (s * 1664525 + 1013904223) >>> 0;
    return s / 4294967296;
  };
  try {
    return fn();
  } finally {
    Math.random = originalRandom;
  }
}

function getTopCompetitorId(state: GameState): string | null {
  const sorted = [...state.business.competition.competitors].sort((a, b) => b.users - a.users);
  return sorted[0]?.id ?? null;
}

function applyActivePlaybook(state: GameState): GameState {
  let next = state;

  const targetQueueByResource: Record<string, number> = { code: 36, design: 32, ops: 26, support: 18 };
  for (const [resource, targetUnits] of Object.entries(targetQueueByResource)) {
    const queued = next.business.production.queue
      .filter(item => item.resource === resource)
      .reduce((sum, item) => sum + Math.max(0, item.units - item.progress), 0);
    if (queued < targetUnits) {
      next = enqueueProduction(next, resource as 'code' | 'design' | 'ops' | 'support', Math.max(1, Math.ceil(targetUnits - queued)));
    }
  }

  if (!next.business.team.some(m => m.role === 'qa' || m.role === 'security')) {
    if (canHire(next, 'qa')) {
      next = hireMember(next, 'qa');
    }
  }

  const featurePriority = ['core_account', 'growth_analytics', 'infra_cache', 'growth_referral', 'mon_subscription'];
  for (const featureId of featurePriority) {
    const install = canInstallFeature(next, featureId);
    if (install.ok) {
      next = installFeature(next, featureId);
      break;
    }
    if (install.reason === 'no_slots' && (next.business.liveProduct?.featureSlots ?? 0) < 5) {
      next = upgradeFeatureSlots(next);
      break;
    }
  }

  for (const featureId of ['core_landing', 'core_account', 'infra_cache']) {
    const check = canUpgradeFeature(next, featureId);
    if (check.ok) {
      next = upgradeFeature(next, featureId);
      break;
    }
  }

  if (next.business.infrastructure.lastWeek.load > 0.95) {
    next = upgradeCloudTier(next);
  }
  if (next.business.support.openTickets > 120) {
    next = runSupportBurst(next, 60);
  }

  if (!next.business.campaign.flags.usedMna && (next.business.liveProduct?.metrics.activeUsers ?? 0) > 1200) {
    const topCompetitorId = getTopCompetitorId(next);
    if (topCompetitorId) {
      const actions = ['buy_user_base', 'brand_boost', 'acquire_technology'] as const;
      for (const action of actions) {
        const can = canExecuteMnaAction(next, action, topCompetitorId);
        if (can.ok) {
          next = executeMnaAction(next, action, topCompetitorId);
          break;
        }
      }
    }
  }

  return next;
}

function evaluateWarnings(report: EvaluationBase): string[] {
  const warnings: string[] = [];
  if (report.marketPressure > 0.28) warnings.push('high_final_market_pressure');
  if (report.maxPressure > 0.34) warnings.push('pressure_spikes_too_high');
  if (report.satisfaction < 0.45) warnings.push('low_end_satisfaction');
  if (report.minSatisfaction < 0.38) warnings.push('deep_satisfaction_dip');
  if (report.maxLoad > 1.2) warnings.push('infrastructure_overload_too_high');
  if (report.maxOpenTickets > 240) warnings.push('support_backlog_too_high');
  if (report.mode === 'active' && report.activeUsers < 4000) warnings.push('active_mode_growth_too_low');
  if (report.mode === 'active' && report.completedMilestones < 4) warnings.push('milestones_progress_too_slow');
  return warnings;
}

function normalizeSandboxProgress(state: GameState): GameState {
  if (state.phase === 'playing') return state;
  return {
    ...state,
    phase: 'playing',
    player: {
      ...state.player,
      money: Math.max(state.player.money, 5000),
      reputation: Math.max(state.player.reputation, 20),
    },
  };
}

function runScenario(scenario: Scenario): ScenarioReport {
  return withSeededRandom(scenario.seed, () => {
    let state = createBalanceState();

    let maxLoad = 0;
    let maxPressure = 0;
    let maxOpenTickets = 0;
    let minSatisfaction = 1;

    for (let i = 0; i < scenario.weeks; i++) {
      if (scenario.mode === 'active') {
        state = applyActivePlaybook(state);
      }

      state = {
        ...state,
        player: {
          ...state.player,
          currentWeek: state.player.currentWeek + 1,
          weekProgress: 0,
        },
      };
      state = simulateWeek(state);
      state = normalizeSandboxProgress(state);

      maxLoad = Math.max(maxLoad, state.business.infrastructure.lastWeek.load);
      maxPressure = Math.max(maxPressure, state.business.competition.lastWeek.marketPressure);
      maxOpenTickets = Math.max(maxOpenTickets, state.business.support.openTickets);
      minSatisfaction = Math.min(minSatisfaction, state.business.liveProduct?.metrics.satisfaction ?? minSatisfaction);
    }

    const live = state.business.liveProduct;
    const base = {
      mode: scenario.mode,
      marketPressure: Number(state.business.competition.lastWeek.marketPressure.toFixed(3)),
      maxPressure: Number(maxPressure.toFixed(3)),
      satisfaction: Number((live?.metrics.satisfaction ?? 0).toFixed(3)),
      minSatisfaction: Number(minSatisfaction.toFixed(3)),
      maxLoad: Number(maxLoad.toFixed(3)),
      maxOpenTickets,
      activeUsers: live?.metrics.activeUsers ?? 0,
      completedMilestones: state.business.campaign.completedIds.length,
    };
    const warnings = evaluateWarnings(base);

    return {
      scenario,
      endWeek: state.player.currentWeek,
      money: Math.round(state.player.money),
      reputation: Math.round(state.player.reputation),
      activeUsers: live?.metrics.activeUsers ?? 0,
      payingUsers: live?.metrics.payingUsers ?? 0,
      satisfaction: Number((live?.metrics.satisfaction ?? 0).toFixed(3)),
      churn: Number((live?.metrics.churn ?? 0).toFixed(3)),
      rank: state.business.competition.lastWeek.playerRank,
      marketShare: Number(state.business.competition.lastWeek.playerMarketShare.toFixed(3)),
      marketPressure: Number(state.business.competition.lastWeek.marketPressure.toFixed(3)),
      maxLoad: Number(maxLoad.toFixed(3)),
      maxPressure: Number(maxPressure.toFixed(3)),
      maxOpenTickets,
      minSatisfaction: Number(minSatisfaction.toFixed(3)),
      completedMilestones: state.business.campaign.completedIds.length,
      usedMna: state.business.campaign.flags.usedMna,
      warnings,
    };
  });
}

function formatReport(report: ScenarioReport): string {
  const s = report.scenario;
  return [
    `[${s.name}] mode=${s.mode} weeks=${s.weeks} seed=${s.seed}`,
    `  endWeek=${report.endWeek} money=$${report.money.toLocaleString()} rep=${report.reputation}`,
    `  users active=${report.activeUsers.toLocaleString()} paying=${report.payingUsers.toLocaleString()} rank=#${report.rank} share=${(report.marketShare * 100).toFixed(1)}%`,
    `  product sat=${(report.satisfaction * 100).toFixed(1)}% churn=${(report.churn * 100).toFixed(1)}%`,
    `  pressure now=${(report.marketPressure * 100).toFixed(1)}% max=${(report.maxPressure * 100).toFixed(1)}% infraMaxLoad=${(report.maxLoad * 100).toFixed(1)}%`,
    `  support maxOpen=${report.maxOpenTickets} milestones=${report.completedMilestones} mna=${report.usedMna ? 'yes' : 'no'}`,
    `  warnings=${report.warnings.length > 0 ? report.warnings.join(',') : 'none'}`,
  ].join('\n');
}

function run(): number {
  const scenarios: Scenario[] = [
    { name: 'baseline_1y', mode: 'passive', weeks: 52, seed: 1337 },
    { name: 'baseline_2y', mode: 'passive', weeks: 104, seed: 2026 },
    { name: 'active_1y', mode: 'active', weeks: 52, seed: 42 },
    { name: 'active_2y', mode: 'active', weeks: 104, seed: 7 },
  ];

  const reports = scenarios.map(runScenario);
  for (const report of reports) {
    process.stdout.write(`${formatReport(report)}\n`);
  }

  const hasWarnings = reports.some(r => r.warnings.length > 0);
  if (hasWarnings) {
    process.stdout.write('[CHECK] R4 balance check completed with warnings.\n');
    return 1;
  }
  process.stdout.write('[CHECK] R4 balance check passed without warnings.\n');
  return 0;
}

process.exitCode = run();
