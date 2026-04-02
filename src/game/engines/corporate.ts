import { BALANCE } from '../config/balance';
import { FUNDING_ROUND_LABEL, FUNDING_ROUND_ORDER } from '../data-corporate';
import { BoardGoal, BoardGoalType, FundingRoundId, GameState, InvestorOffer } from '../types';

function clamp(min: number, max: number, value: number): number {
  return Math.max(min, Math.min(max, value));
}

function formatPercent(value: number): string {
  return `${(value * 100).toFixed(1)}%`;
}

function getCurrentGoalMetric(state: Pick<GameState, 'player' | 'business'>, type: BoardGoalType): number {
  const live = state.business.liveProduct;
  switch (type) {
    case 'active_users':
      return live?.metrics.activeUsers ?? 0;
    case 'satisfaction':
      return live?.metrics.satisfaction ?? 0;
    case 'low_churn':
      return live?.metrics.churn ?? 0;
    case 'weekly_profit':
      return state.business.metrics.profit;
    default:
      return 0;
  }
}

function getGoalTarget(type: BoardGoalType, state: GameState): number {
  const cfg = BALANCE.corporate.boardGoals;
  const live = state.business.liveProduct;
  switch (type) {
    case 'active_users': {
      const active = live?.metrics.activeUsers ?? 0;
      return Math.max(
        cfg.activeUsersMinTarget,
        Math.round(active * cfg.activeUsersStretchRatio + 120),
      );
    }
    case 'satisfaction': {
      const sat = live?.metrics.satisfaction ?? 0.55;
      return clamp(
        cfg.satisfactionMinTarget,
        0.9,
        sat + cfg.satisfactionStretchDelta,
      );
    }
    case 'low_churn': {
      const churn = live?.metrics.churn ?? 0.1;
      const desired = Math.min(cfg.churnMaxTarget, Math.max(0.04, churn - 0.03));
      return desired;
    }
    case 'weekly_profit': {
      const profit = state.business.metrics.profit;
      const base = Math.max(cfg.profitMinTarget, profit > 0 ? profit : cfg.profitMinTarget);
      return Math.round(base * cfg.profitStretchRatio);
    }
    default:
      return cfg.profitMinTarget;
  }
}

function pickGoalType(state: GameState): BoardGoalType {
  const cfg = BALANCE.corporate.boardGoals;
  const live = state.business.liveProduct;
  const active = live?.metrics.activeUsers ?? 0;
  const sat = live?.metrics.satisfaction ?? 0.55;
  const churn = live?.metrics.churn ?? 0.1;
  const profit = state.business.metrics.profit;

  if (active < cfg.activeUsersMinTarget) return 'active_users';
  if (churn > cfg.churnMaxTarget + 0.015) return 'low_churn';
  if (sat < cfg.satisfactionMinTarget) return 'satisfaction';
  if (profit < cfg.profitMinTarget) return 'weekly_profit';

  const roll = Math.random();
  if (roll < 0.3) return 'active_users';
  if (roll < 0.55) return 'weekly_profit';
  if (roll < 0.8) return 'satisfaction';
  return 'low_churn';
}

function buildBoardGoal(state: GameState, seq: number): BoardGoal {
  const cfg = BALANCE.corporate.boardGoals;
  const pressure = state.business.corporate.boardPressure;
  const type = pickGoalType(state);
  const target = getGoalTarget(type, state);
  const rewardMoney = Math.round(cfg.rewardMoneyBase + pressure * cfg.rewardMoneyPressureScale);
  const rewardReputation = Math.max(1, Math.round(cfg.rewardReputationBase + pressure * cfg.rewardReputationPressureScale));
  const penaltyReputation = Math.max(1, Math.round(cfg.penaltyReputationBase + pressure * cfg.penaltyReputationPressureScale));

  return {
    id: `bg_${seq}`,
    type,
    target,
    startWeek: state.player.currentWeek,
    dueWeek: state.player.currentWeek + cfg.defaultDeadlineWeeks,
    rewardMoney,
    rewardReputation,
    pressureRelief: clamp(0.02, 0.35, cfg.reliefBase + pressure * cfg.reliefPressureScale),
    penaltyReputation,
    pressureIncrease: clamp(0.03, 0.3, cfg.penaltyPressureBase + pressure * cfg.penaltyPressureScale),
  };
}

export function getBoardGoalLabel(goal: BoardGoal): string {
  switch (goal.type) {
    case 'active_users':
      return `Reach ${Math.round(goal.target).toLocaleString()} active users`;
    case 'satisfaction':
      return `Raise satisfaction to ${formatPercent(goal.target)} or higher`;
    case 'low_churn':
      return `Reduce churn to ${formatPercent(goal.target)} or lower`;
    case 'weekly_profit':
      return `Reach weekly profit of $${Math.round(goal.target).toLocaleString()}`;
    default:
      return 'Board objective';
  }
}

export function evaluateBoardGoal(state: Pick<GameState, 'player' | 'business'>, goal: BoardGoal): {
  current: number;
  progress: number;
  met: boolean;
  currentText: string;
  targetText: string;
} {
  const current = getCurrentGoalMetric(state, goal.type);
  let progress = 0;
  let met = false;

  if (goal.type === 'low_churn') {
    met = current <= goal.target;
    progress = clamp(0, 1, goal.target / Math.max(goal.target, current));
  } else {
    met = current >= goal.target;
    progress = clamp(0, 1, current / Math.max(1e-9, goal.target));
  }

  const currentText = goal.type === 'active_users'
    ? `${Math.round(current).toLocaleString()}`
    : goal.type === 'weekly_profit'
      ? `$${Math.round(current).toLocaleString()}`
      : formatPercent(current);
  const targetText = goal.type === 'active_users'
    ? `${Math.round(goal.target).toLocaleString()}`
    : goal.type === 'weekly_profit'
      ? `$${Math.round(goal.target).toLocaleString()}`
      : formatPercent(goal.target);

  return { current, progress, met, currentText, targetText };
}

export function calculateCompanyValuation(state: GameState): number {
  const cfg = BALANCE.corporate.valuation;
  const live = state.business.liveProduct;
  const activeUsers = live?.metrics.activeUsers ?? 0;
  const payingUsers = live?.metrics.payingUsers ?? 0;
  const reputation = state.player.reputation;
  const profit = state.business.metrics.profit;

  const raw = cfg.base
    + activeUsers * cfg.activeUserWeight
    + payingUsers * cfg.payingUserWeight
    + reputation * cfg.reputationWeight
    + (profit >= 0 ? profit * cfg.profitWeight : profit * cfg.negativeProfitWeight);

  return Math.round(clamp(cfg.min, cfg.max, raw));
}

function isRoundRaised(state: GameState, roundId: FundingRoundId): boolean {
  return state.business.corporate.rounds.some((round) => round.id === roundId && round.raised);
}

function getRoundDef(roundId: FundingRoundId) {
  return BALANCE.corporate.rounds[roundId];
}

function getOfferCooldownWeeks(pressure: number): number {
  const cfg = BALANCE.corporate.offers;
  const reduction = Math.round(cfg.pressureCooldownReductionWeeks * pressure);
  return Math.max(2, cfg.baseCooldownWeeks - reduction);
}

function getOfferRoundId(state: GameState): FundingRoundId | null {
  for (const roundId of FUNDING_ROUND_ORDER) {
    if (isRoundRaised(state, roundId)) continue;
    const def = getRoundDef(roundId);
    if (state.player.currentWeek >= def.minWeek) return roundId;
    return null;
  }
  return null;
}

function buildInvestorOffer(state: GameState, roundId: FundingRoundId, seq: number): InvestorOffer {
  const cfg = BALANCE.corporate.offers;
  const roundDef = getRoundDef(roundId);
  const valuation = calculateCompanyValuation(state);
  const pressure = state.business.corporate.boardPressure;

  const cashRoll = (Math.random() * 2 - 1) * cfg.cashVariance;
  const cashMultiplier = clamp(
    0.6,
    1.4,
    cfg.cashBaseMultiplier + pressure * cfg.cashPressureBonus + cashRoll,
  );
  const equityRoll = (Math.random() * 2 - 1) * cfg.equityVariance;
  const equityMultiplier = clamp(
    0.85,
    1.6,
    cfg.equityBaseMultiplier + pressure * cfg.equityPressureBonus + equityRoll,
  );
  const minValuationRatio = clamp(
    0.55,
    0.99,
    cfg.minValuationRatioBase + pressure * cfg.minValuationRatioPressureScale,
  );

  return {
    id: `offer_${seq}`,
    roundId,
    cash: Math.max(10000, Math.round(roundDef.cash * cashMultiplier)),
    equity: clamp(0.05, 0.45, roundDef.equity * equityMultiplier),
    minValuation: Math.round(Math.max(cfg.minValuationFloor, valuation * minValuationRatio)),
    createdWeek: state.player.currentWeek,
    expiresWeek: state.player.currentWeek + cfg.offerDurationWeeks,
  };
}

export function canRaiseFundingRound(
  state: GameState,
  roundId: FundingRoundId,
): { ok: boolean; reason?: string; valuation?: number } {
  const index = FUNDING_ROUND_ORDER.indexOf(roundId);
  if (index > 0) {
    const previousRoundId = FUNDING_ROUND_ORDER[index - 1];
    if (!isRoundRaised(state, previousRoundId)) {
      return { ok: false, reason: 'previous_round_required' };
    }
  }

  if (isRoundRaised(state, roundId)) {
    return { ok: false, reason: 'already_raised' };
  }

  const valuation = calculateCompanyValuation(state);
  const round = getRoundDef(roundId);
  if (state.player.currentWeek < round.minWeek) {
    return { ok: false, reason: 'too_early', valuation };
  }
  if (valuation < round.minValuation) {
    return { ok: false, reason: 'valuation_too_low', valuation };
  }
  if (state.business.corporate.founderEquity <= round.equity + 0.05) {
    return { ok: false, reason: 'founder_equity_too_low', valuation };
  }
  return { ok: true, valuation };
}

export function canAcceptInvestorOffer(
  state: GameState,
): { ok: boolean; reason?: string; valuation?: number } {
  const offer = state.business.corporate.activeOffer;
  if (!offer) {
    return { ok: false, reason: 'no_active_offer' };
  }
  if (state.player.currentWeek >= offer.expiresWeek) {
    return { ok: false, reason: 'offer_expired' };
  }
  if (isRoundRaised(state, offer.roundId)) {
    return { ok: false, reason: 'round_already_raised' };
  }
  const roundIdx = FUNDING_ROUND_ORDER.indexOf(offer.roundId);
  if (roundIdx > 0) {
    const prevRoundId = FUNDING_ROUND_ORDER[roundIdx - 1];
    if (!isRoundRaised(state, prevRoundId)) {
      return { ok: false, reason: 'previous_round_required' };
    }
  }

  const valuation = calculateCompanyValuation(state);
  if (valuation < offer.minValuation) {
    return { ok: false, reason: 'valuation_too_low', valuation };
  }
  if (state.business.corporate.founderEquity <= offer.equity + 0.03) {
    return { ok: false, reason: 'founder_equity_too_low', valuation };
  }

  return { ok: true, valuation };
}

export function acceptInvestorOffer(state: GameState): GameState {
  const check = canAcceptInvestorOffer(state);
  if (!check.ok) return state;

  const offer = state.business.corporate.activeOffer;
  if (!offer) return state;

  const valuation = check.valuation ?? calculateCompanyValuation(state);
  const corporate = state.business.corporate;
  const oldFounder = corporate.founderEquity;
  const newFounder = clamp(0, 1, oldFounder * (1 - offer.equity));
  const newInvestor = clamp(0, 1, 1 - newFounder);
  const pressure = clamp(0, 1, corporate.boardPressure - BALANCE.corporate.offers.pressureReliefOnAccept);

  return {
    ...state,
    player: {
      ...state.player,
      money: Math.round(state.player.money + offer.cash),
    },
    business: {
      ...state.business,
      corporate: {
        ...corporate,
        founderEquity: newFounder,
        investorEquity: newInvestor,
        cumulativeCashRaised: Math.round(corporate.cumulativeCashRaised + offer.cash),
        valuation,
        boardPressure: pressure,
        activeOffer: null,
        offersAccepted: corporate.offersAccepted + 1,
        nextOfferWeek: state.player.currentWeek + getOfferCooldownWeeks(pressure),
        rounds: corporate.rounds.map((entry) => (
          entry.id === offer.roundId
            ? {
              ...entry,
              raised: true,
              weekRaised: state.player.currentWeek,
              cashRaised: offer.cash,
              equitySold: offer.equity,
              postMoneyValuation: valuation,
            }
            : entry
        )),
      },
    },
    logs: [
      ...state.logs,
      {
        week: state.player.currentWeek,
        type: 'success',
        message: `Investor offer accepted: ${FUNDING_ROUND_LABEL[offer.roundId]} +$${offer.cash.toLocaleString()} for ${(offer.equity * 100).toFixed(1)}% equity.`,
      },
    ],
  };
}

export function rejectInvestorOffer(state: GameState): GameState {
  const offer = state.business.corporate.activeOffer;
  if (!offer) return state;

  const cfg = BALANCE.corporate.offers;
  const corporate = state.business.corporate;
  const pressure = clamp(0, 1, corporate.boardPressure + cfg.pressureIncreaseOnReject);

  return {
    ...state,
    player: {
      ...state.player,
      reputation: clamp(0, 100, state.player.reputation - cfg.reputationPenaltyOnReject),
    },
    business: {
      ...state.business,
      corporate: {
        ...corporate,
        boardPressure: pressure,
        activeOffer: null,
        offersRejected: corporate.offersRejected + 1,
        nextOfferWeek: state.player.currentWeek + getOfferCooldownWeeks(pressure),
      },
    },
    logs: [
      ...state.logs,
      {
        week: state.player.currentWeek,
        type: 'warning',
        message: `Investor offer rejected: ${FUNDING_ROUND_LABEL[offer.roundId]} proposal declined.`,
      },
    ],
  };
}

export function raiseFundingRound(state: GameState, roundId: FundingRoundId): GameState {
  const check = canRaiseFundingRound(state, roundId);
  if (!check.ok) return state;

  const valuation = check.valuation ?? calculateCompanyValuation(state);
  const round = getRoundDef(roundId);
  const corporate = state.business.corporate;
  const oldFounder = corporate.founderEquity;
  const newFounder = clamp(0, 1, oldFounder * (1 - round.equity));
  const newInvestor = clamp(0, 1, 1 - newFounder);

  return {
    ...state,
    player: {
      ...state.player,
      money: Math.round(state.player.money + round.cash),
    },
    business: {
      ...state.business,
      corporate: {
        ...corporate,
        founderEquity: newFounder,
        investorEquity: newInvestor,
        cumulativeCashRaised: Math.round(corporate.cumulativeCashRaised + round.cash),
        valuation,
        rounds: corporate.rounds.map((entry) => (
          entry.id === roundId
            ? {
              ...entry,
              raised: true,
              weekRaised: state.player.currentWeek,
              cashRaised: round.cash,
              equitySold: round.equity,
              postMoneyValuation: valuation,
            }
            : entry
        )),
      },
    },
    logs: [
      ...state.logs,
      {
        week: state.player.currentWeek,
        type: 'success',
        message: `Funding closed: ${FUNDING_ROUND_LABEL[roundId]} +$${round.cash.toLocaleString()} for ${(round.equity * 100).toFixed(1)}% equity.`,
      },
    ],
  };
}

export function getBuybackCost(state: GameState, pct: number): number {
  const buybackCfg = BALANCE.corporate.buyback;
  const valuation = calculateCompanyValuation(state);
  const boundedPct = clamp(buybackCfg.minPct, buybackCfg.maxPctPerAction, pct);
  return Math.round(valuation * boundedPct * buybackCfg.premium);
}

export function canExecuteBuyback(
  state: GameState,
  pct: number,
): { ok: boolean; reason?: string; cost?: number; adjustedPct?: number } {
  if (state.business.corporate.investorEquity <= 0.001) {
    return { ok: false, reason: 'no_investor_equity' };
  }
  const buybackCfg = BALANCE.corporate.buyback;
  const adjustedPct = clamp(buybackCfg.minPct, buybackCfg.maxPctPerAction, pct);
  const maxByInvestor = Math.max(0, state.business.corporate.investorEquity - 0.001);
  if (maxByInvestor <= 0) {
    return { ok: false, reason: 'no_investor_equity' };
  }
  const finalPct = Math.min(adjustedPct, maxByInvestor);
  const cost = getBuybackCost(state, finalPct);
  return { ok: true, cost, adjustedPct: finalPct };
}

export function executeBuyback(state: GameState, pct: number): GameState {
  const check = canExecuteBuyback(state, pct);
  if (!check.ok) return state;

  const buyPct = check.adjustedPct ?? 0;
  const cost = check.cost ?? getBuybackCost(state, buyPct);
  const corporate = state.business.corporate;
  const newFounder = clamp(0, 1, corporate.founderEquity + buyPct);
  const newInvestor = clamp(0, 1, corporate.investorEquity - buyPct);

  return {
    ...state,
    player: {
      ...state.player,
      money: Math.round(state.player.money - cost),
    },
    business: {
      ...state.business,
      corporate: {
        ...corporate,
        founderEquity: newFounder,
        investorEquity: newInvestor,
      },
    },
    logs: [
      ...state.logs,
      {
        week: state.player.currentWeek,
        type: 'info',
        message: `Buyback executed: ${(buyPct * 100).toFixed(1)}% equity for $${cost.toLocaleString()}.`,
      },
    ],
  };
}

export function tickCorporateGovernance(state: GameState): GameState {
  const corporate = state.business.corporate;
  const valuation = calculateCompanyValuation(state);
  const valuationDelta = valuation - corporate.valuation;

  const pressureCfg = BALANCE.corporate.boardPressure;
  const live = state.business.liveProduct;
  const churn = live?.metrics.churn ?? 0.1;
  const growth = state.business.metrics.growthRate;
  const profit = state.business.metrics.profit;
  const satisfaction = live?.metrics.satisfaction ?? 0.5;

  const equityPressure = Math.max(0, corporate.investorEquity - pressureCfg.investorEquityFreeBand) * pressureCfg.investorEquityScale;
  const growthPenalty = growth < pressureCfg.lowGrowthThreshold ? pressureCfg.lowGrowthPenalty : 0;
  const profitPenalty = profit < 0 ? pressureCfg.negativeProfitPenalty : 0;
  const churnPenalty = churn > pressureCfg.highChurnThreshold ? pressureCfg.highChurnPenalty : 0;
  const satisfactionRelief = satisfaction > pressureCfg.highSatisfactionThreshold ? pressureCfg.highSatisfactionRelief : 0;

  const targetPressure = clamp(
    0,
    1,
    equityPressure + growthPenalty + profitPenalty + churnPenalty - satisfactionRelief,
  );
  const nextPressure = clamp(
    0,
    1,
    corporate.boardPressure * pressureCfg.pressureCarry + targetPressure * (1 - pressureCfg.pressureCarry),
  );
  const pressureDelta = nextPressure - corporate.boardPressure;

  let nextPlayer = state.player;
  let adjustedPressure = nextPressure;
  let nextCorporate = {
    ...corporate,
    valuation,
    boardPressure: adjustedPressure,
    lastWeek: {
      valuationDelta,
      boardPressureDelta: pressureDelta,
    },
  };
  const nextLogs = [...state.logs];

  if (nextCorporate.activeOffer) {
    const offer = nextCorporate.activeOffer;
    if (isRoundRaised(state, offer.roundId)) {
      nextCorporate = {
        ...nextCorporate,
        activeOffer: null,
        nextOfferWeek: state.player.currentWeek + getOfferCooldownWeeks(adjustedPressure),
      };
      nextLogs.push({
        week: state.player.currentWeek,
        type: 'info',
        message: `Investor offer withdrawn: ${FUNDING_ROUND_LABEL[offer.roundId]} round is already closed.`,
      });
    } else if (state.player.currentWeek >= offer.expiresWeek) {
      const cfg = BALANCE.corporate.offers;
      adjustedPressure = clamp(0, 1, adjustedPressure + cfg.pressureIncreaseOnExpire);
      nextPlayer = {
        ...nextPlayer,
        reputation: clamp(0, 100, nextPlayer.reputation - cfg.reputationPenaltyOnExpire),
      };
      nextCorporate = {
        ...nextCorporate,
        boardPressure: adjustedPressure,
        activeOffer: null,
        offersExpired: nextCorporate.offersExpired + 1,
        nextOfferWeek: state.player.currentWeek + getOfferCooldownWeeks(adjustedPressure),
      };
      nextLogs.push({
        week: state.player.currentWeek,
        type: 'warning',
        message: `Investor offer expired: ${FUNDING_ROUND_LABEL[offer.roundId]} terms were not accepted in time.`,
      });
    }
  }

  if (nextCorporate.activeGoal) {
    const goal = nextCorporate.activeGoal;
    const goalEval = evaluateBoardGoal(state, goal);
    if (goalEval.met) {
      nextPlayer = {
        ...nextPlayer,
        money: Math.round(nextPlayer.money + goal.rewardMoney),
        reputation: clamp(0, 100, nextPlayer.reputation + goal.rewardReputation),
      };
      adjustedPressure = clamp(0, 1, adjustedPressure - goal.pressureRelief);
      nextCorporate = {
        ...nextCorporate,
        boardPressure: adjustedPressure,
        goalsCompleted: nextCorporate.goalsCompleted + 1,
        activeGoal: null,
        nextGoalWeek: state.player.currentWeek + BALANCE.corporate.boardGoals.cooldownWeeks,
      };
      nextLogs.push({
        week: state.player.currentWeek,
        type: 'success',
        message: `Board goal completed: ${getBoardGoalLabel(goal)} (+$${goal.rewardMoney.toLocaleString()}, +${goal.rewardReputation} rep).`,
      });
    } else if (state.player.currentWeek >= goal.dueWeek) {
      nextPlayer = {
        ...nextPlayer,
        reputation: clamp(0, 100, nextPlayer.reputation - goal.penaltyReputation),
      };
      adjustedPressure = clamp(0, 1, adjustedPressure + goal.pressureIncrease);
      nextCorporate = {
        ...nextCorporate,
        boardPressure: adjustedPressure,
        goalsFailed: nextCorporate.goalsFailed + 1,
        activeGoal: null,
        nextGoalWeek: state.player.currentWeek + BALANCE.corporate.boardGoals.cooldownWeeks,
      };
      nextLogs.push({
        week: state.player.currentWeek,
        type: 'warning',
        message: `Board goal failed: ${getBoardGoalLabel(goal)} (-${goal.penaltyReputation} rep, pressure +${Math.round(goal.pressureIncrease * 100)}%).`,
      });
    }
  }

  if (
    !nextCorporate.activeGoal
    && state.player.currentWeek >= nextCorporate.nextGoalWeek
    && nextCorporate.investorEquity >= BALANCE.corporate.boardGoals.minInvestorEquityToActivate
  ) {
    const goal = buildBoardGoal(
      { ...state, player: nextPlayer, business: { ...state.business, corporate: nextCorporate } },
      nextCorporate.nextGoalSeq,
    );
    nextCorporate = {
      ...nextCorporate,
      activeGoal: goal,
      nextGoalSeq: nextCorporate.nextGoalSeq + 1,
    };
    nextLogs.push({
      week: state.player.currentWeek,
      type: 'info',
      message: `Board goal assigned: ${getBoardGoalLabel(goal)} (due W${goal.dueWeek}).`,
    });
  }

  if (
    !nextCorporate.activeOffer
    && state.player.currentWeek >= nextCorporate.nextOfferWeek
    && state.player.currentWeek >= BALANCE.corporate.offers.minWeek
  ) {
    const offerSourceState = { ...state, player: nextPlayer, business: { ...state.business, corporate: nextCorporate } };
    const offerRoundId = getOfferRoundId(offerSourceState);
    if (offerRoundId) {
      const offer = buildInvestorOffer(offerSourceState, offerRoundId, nextCorporate.nextOfferSeq);
      nextCorporate = {
        ...nextCorporate,
        activeOffer: offer,
        nextOfferSeq: nextCorporate.nextOfferSeq + 1,
      };
      nextLogs.push({
        week: state.player.currentWeek,
        type: 'info',
        message: `New investor offer: ${FUNDING_ROUND_LABEL[offer.roundId]} +$${offer.cash.toLocaleString()} for ${(offer.equity * 100).toFixed(1)}% equity (expires W${offer.expiresWeek}).`,
      });
    }
  }

  const repPenalty = Math.round(adjustedPressure * pressureCfg.repPenaltyScale);
  let nextMetrics = state.business.metrics;
  if (repPenalty > 0) {
    nextPlayer = {
      ...nextPlayer,
      reputation: clamp(0, 100, nextPlayer.reputation - repPenalty),
    };
    nextMetrics = {
      ...nextMetrics,
      risk: clamp(0, 1, nextMetrics.risk + adjustedPressure * pressureCfg.riskPenaltyScale),
    };
  }

  if (Math.abs(valuationDelta) >= 50000) {
    const sign = valuationDelta >= 0 ? '+' : '';
    nextLogs.push({
      week: state.player.currentWeek,
      type: valuationDelta >= 0 ? 'success' : 'warning',
      message: `Valuation update: ${sign}$${Math.abs(valuationDelta).toLocaleString()} (now $${valuation.toLocaleString()}).`,
    });
  }
  if (adjustedPressure >= 0.45) {
    nextLogs.push({
      week: state.player.currentWeek,
      type: 'warning',
      message: `Board pressure is high (${Math.round(adjustedPressure * 100)}%). Growth expectations are increasing.`,
    });
  }

  return {
    ...state,
    player: nextPlayer,
    business: {
      ...state.business,
      metrics: nextMetrics,
      corporate: nextCorporate,
    },
    logs: nextLogs,
  };
}
