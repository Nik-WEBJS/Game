import { BusinessMetrics, GameState } from '../types';
import { NICHES } from '../data';
import { generateMarketPool, MARKET_REFRESH_INTERVAL } from '../data-advanced';
import { rollEvents, applyEvents } from './events';
import { tickTeam } from './team';
import { tickProducts } from './product';
import { tickISO } from './iso';
import { gainExperience, checkWinLose } from './progression';
import { tickFreelance } from './freelance';
import { calculateEconomyWithBreakdown, EconomyBreakdown } from './economy';
import { tickLiveProduct } from './live-product';
import { tickProduction } from './production';
import { getT } from '../../i18n';
import { ttNodeName } from '../../i18n/game-text';
import { BALANCE } from '../config/balance';

export interface DeterministicSimulationResult {
  ok: boolean;
  seed: number;
  weeks: number;
  startWeek: number;
  endWeek: number;
  issues: string[];
  summary: string;
}

export function simulateWeek(state: GameState): GameState {
  let gs = tickTeam(state);
  gs = tickProducts(gs);
  gs = tickISO(gs);
  gs = tickProduction(gs);
  gs = tickLiveProduct(gs);

  const beforeMetrics = gs.business.metrics;
  const econ = calculateEconomyWithBreakdown(gs);
  gs = {
    ...gs,
    player: { ...gs.player, money: Math.round(gs.player.money + econ.metrics.profit) },
    business: { ...gs.business, metrics: econ.metrics },
  };
  gs = appendMetricReasonLogs(gs, beforeMetrics, econ.metrics, econ.breakdown);

  const events = rollEvents(gs);
  gs = events.length > 0 ? applyEvents(gs, events) : { ...gs, activeEvents: [] };

  gs = gainExperience(gs);

  const niche = NICHES.find(n => n.id === gs.business.nicheId);
  if (niche) niche.baseDemand = Math.max(0.2, niche.baseDemand - niche.trendDecayRate);

  gs = tickFreelance(gs);
  gs = tickTechTree(gs);
  gs = tickEmployeeMarket(gs);
  gs = { ...gs, weekHistory: [...gs.weekHistory, { ...gs.business.metrics }] };
  gs = checkWinLose(gs);
  return gs;
}

export function runDeterministicSimulationTest(
  startState: GameState,
  weeks = 52,
  seed = 1337,
): DeterministicSimulationResult {
  const count = Math.max(1, Math.min(BALANCE.simulation.maxFastForwardWeeks, Math.floor(weeks)));
  const snapshot = safeCloneState(startState);
  const nicheDemandSnapshot = NICHES.map(n => n.baseDemand);
  let sim = snapshot;
  const normalizedSeed = Number.isFinite(seed) ? (seed >>> 0) : 1337;

  if (sim.phase !== 'playing') {
    return {
      ok: false,
      seed: normalizedSeed,
      weeks: count,
      startWeek: sim.player.currentWeek,
      endWeek: sim.player.currentWeek,
      issues: ['phase_not_playing'],
      summary: 'Self-test requires active playing phase.',
    };
  }

  const result = withSeededRandom(normalizedSeed, () => {
    const issues: string[] = [];
    const startWeek = sim.player.currentWeek;
    for (let i = 0; i < count; i++) {
      if (sim.phase !== 'playing') break;
      sim = {
        ...sim,
        player: {
          ...sim.player,
          currentWeek: sim.player.currentWeek + 1,
          weekProgress: 0,
        },
      };
      sim = simulateWeek(sim);
      issues.push(...validateSimulationState(sim, i));
    }
    const uniqueIssues = Array.from(new Set(issues));
    return {
      ok: uniqueIssues.length === 0,
      seed: normalizedSeed,
      weeks: count,
      startWeek,
      endWeek: sim.player.currentWeek,
      issues: uniqueIssues,
      summary: uniqueIssues.length === 0
        ? `Self-test passed for ${count} weeks (seed ${normalizedSeed}).`
        : `Self-test found ${uniqueIssues.length} issue(s).`,
    } satisfies DeterministicSimulationResult;
  });

  NICHES.forEach((n, i) => {
    n.baseDemand = nicheDemandSnapshot[i];
  });

  return result;
}

function appendMetricReasonLogs(
  state: GameState,
  prev: BusinessMetrics,
  next: BusinessMetrics,
  breakdown: EconomyBreakdown,
): GameState {
  const logs = [...state.logs];
  const week = state.player.currentWeek;
  const deltaProfit = next.profit - prev.profit;
  const deltaQuality = next.quality - prev.quality;
  const deltaDemand = next.demand - prev.demand;
  const deltaRisk = next.risk - prev.risk;

  if (Math.abs(deltaProfit) >= BALANCE.simulation.reasonLog.profitDeltaThreshold) {
    const sign = deltaProfit > 0 ? '+' : '';
    logs.push({
      week,
      type: deltaProfit > 0 ? 'success' : 'warning',
      message: `Profit ${sign}$${Math.round(deltaProfit).toLocaleString()} (rev $${Math.round(breakdown.revenue.total).toLocaleString()} vs costs $${Math.round(breakdown.costs.total).toLocaleString()})`,
    });
  }
  if (Math.abs(deltaQuality) >= BALANCE.simulation.reasonLog.qualityDeltaThreshold) {
    const sign = deltaQuality > 0 ? '+' : '';
    logs.push({
      week,
      type: deltaQuality > 0 ? 'info' : 'warning',
      message: `Quality ${sign}${(deltaQuality * 100).toFixed(1)}pp (team ${Math.round(next.teamEfficiency * 100)}%, tech bonus ${(breakdown.combination.factors.totalTechQualityBonus * 100).toFixed(1)}pp)`,
    });
  }
  if (Math.abs(deltaDemand) >= BALANCE.simulation.reasonLog.demandDeltaThreshold) {
    const sign = deltaDemand > 0 ? '+' : '';
    logs.push({
      week,
      type: deltaDemand > 0 ? 'info' : 'warning',
      message: `Demand ${sign}${(deltaDemand * 100).toFixed(1)}pp (audience ${(breakdown.combination.factors.avgAudience * 100).toFixed(0)}%, fit ${breakdown.combination.factors.productFit.toFixed(2)})`,
    });
  }
  if (Math.abs(deltaRisk) >= BALANCE.simulation.reasonLog.riskDeltaThreshold) {
    const sign = deltaRisk > 0 ? '+' : '';
    logs.push({
      week,
      type: deltaRisk > 0 ? 'warning' : 'success',
      message: `Risk ${sign}${(deltaRisk * 100).toFixed(1)}pp (complexity ${(breakdown.combination.factors.totalTechComplexity * 100).toFixed(1)}pp, ISO ${(breakdown.combination.factors.isoStabilization * 100).toFixed(1)}pp)`,
    });
  }

  return { ...state, logs };
}

function tickTechTree(state: GameState): GameState {
  let changed = false;
  const newTree = state.business.techTree.map(node => {
    if (!node.researching) return node;
    const progressPerWeek = 100 / node.weeksToResearch;
    const newProgress = Math.min(100, node.researchProgress + progressPerWeek);
    if (newProgress >= 100) {
      changed = true;
      return { ...node, researching: false, researchProgress: 100, completed: true };
    }
    return { ...node, researchProgress: newProgress };
  });

  const finalTree = newTree.map(node => {
    if (node.unlocked || node.completed) return node;
    const allReqsMet = node.requires.every(reqId => newTree.find(n => n.id === reqId)?.completed);
    if (allReqsMet) return { ...node, unlocked: true };
    return node;
  });

  const newLogs = [...state.logs];
  if (changed) {
    const completed = finalTree.filter(n => n.completed && !state.business.techTree.find(o => o.id === n.id)?.completed);
    for (const c of completed) {
      newLogs.push({ week: state.player.currentWeek, message: getT().researchCompleteMessage(ttNodeName(c.id, getT(), c.name)), type: 'success' });
    }
  }

  return { ...state, business: { ...state.business, techTree: finalTree }, logs: newLogs };
}

function tickEmployeeMarket(state: GameState): GameState {
  const weeksSinceRefresh = state.player.currentWeek - state.business.marketRefreshWeek;
  if (weeksSinceRefresh >= MARKET_REFRESH_INTERVAL) {
    return {
      ...state,
      business: {
        ...state.business,
        employeeMarket: generateMarketPool(5, state.player.reputation),
        marketRefreshWeek: state.player.currentWeek,
      },
      logs: [...state.logs, { week: state.player.currentWeek, message: getT().marketRefreshedMessage, type: 'info' }],
    };
  }
  return state;
}

function safeCloneState<T>(value: T): T {
  if (typeof structuredClone === 'function') {
    return structuredClone(value);
  }
  return JSON.parse(JSON.stringify(value)) as T;
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

function validateSimulationState(state: GameState, step: number): string[] {
  const issues: string[] = [];
  const m = state.business.metrics;
  const tag = `week_step_${step + 1}`;

  const checkFinite = (value: number, name: string) => {
    if (!Number.isFinite(value) || Number.isNaN(value)) {
      issues.push(`${tag}:${name}_not_finite`);
    }
  };

  checkFinite(state.player.money, 'money');
  checkFinite(state.player.reputation, 'reputation');
  checkFinite(m.revenue, 'revenue');
  checkFinite(m.costs, 'costs');
  checkFinite(m.profit, 'profit');
  checkFinite(m.risk, 'risk');
  checkFinite(m.quality, 'quality');
  checkFinite(m.demand, 'demand');
  checkFinite(m.growthRate, 'growth');
  checkFinite(m.teamEfficiency, 'team_efficiency');
  const prod = state.business.production;
  checkFinite(prod.inventory.code, 'production_inventory_code');
  checkFinite(prod.inventory.design, 'production_inventory_design');
  checkFinite(prod.inventory.ops, 'production_inventory_ops');
  checkFinite(prod.inventory.support, 'production_inventory_support');
  checkFinite(prod.nextQueueSeq, 'production_next_queue_seq');

  if (prod.inventory.code < 0) issues.push(`${tag}:production_inventory_code_negative`);
  if (prod.inventory.design < 0) issues.push(`${tag}:production_inventory_design_negative`);
  if (prod.inventory.ops < 0) issues.push(`${tag}:production_inventory_ops_negative`);
  if (prod.inventory.support < 0) issues.push(`${tag}:production_inventory_support_negative`);
  for (const item of prod.queue) {
    checkFinite(item.units, `production_queue_units_${item.id}`);
    checkFinite(item.progress, `production_queue_progress_${item.id}`);
    if (item.units <= 0) issues.push(`${tag}:production_queue_units_non_positive`);
    if (item.progress < 0) issues.push(`${tag}:production_queue_progress_negative`);
  }

  if (m.risk < 0 || m.risk > 1) issues.push(`${tag}:risk_out_of_bounds`);
  if (m.quality < 0 || m.quality > 1) issues.push(`${tag}:quality_out_of_bounds`);
  if (m.demand < 0 || m.demand > 1) issues.push(`${tag}:demand_out_of_bounds`);
  if (m.teamEfficiency < 0 || m.teamEfficiency > 1) issues.push(`${tag}:team_efficiency_out_of_bounds`);

  for (const member of state.business.team) {
    if (member.burnout < 0 || member.burnout > 100) issues.push(`${tag}:member_burnout_out_of_bounds`);
    if (member.morale < 0 || member.morale > 100) issues.push(`${tag}:member_morale_out_of_bounds`);
    if (member.experience < 0 || member.experience > 100) issues.push(`${tag}:member_experience_out_of_bounds`);
    if (member.level < 1 || member.level > 5) issues.push(`${tag}:member_level_out_of_bounds`);
  }

  return issues;
}
