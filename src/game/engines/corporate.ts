import { BALANCE } from '../config/balance';
import { FUNDING_ROUND_LABEL, FUNDING_ROUND_ORDER } from '../data-corporate';
import { FundingRoundId, GameState } from '../types';

function clamp(min: number, max: number, value: number): number {
  return Math.max(min, Math.min(max, value));
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

  let nextState: GameState = {
    ...state,
    business: {
      ...state.business,
      corporate: {
        ...corporate,
        valuation,
        boardPressure: nextPressure,
        lastWeek: {
          valuationDelta,
          boardPressureDelta: pressureDelta,
        },
      },
    },
  };

  const repPenalty = Math.round(nextPressure * pressureCfg.repPenaltyScale);
  if (repPenalty > 0) {
    nextState = {
      ...nextState,
      player: {
        ...nextState.player,
        reputation: clamp(0, 100, nextState.player.reputation - repPenalty),
      },
      business: {
        ...nextState.business,
        metrics: {
          ...nextState.business.metrics,
          risk: clamp(0, 1, nextState.business.metrics.risk + nextPressure * pressureCfg.riskPenaltyScale),
        },
      },
    };
  }

  const nextLogs = [...nextState.logs];
  if (Math.abs(valuationDelta) >= 50000) {
    const sign = valuationDelta >= 0 ? '+' : '';
    nextLogs.push({
      week: state.player.currentWeek,
      type: valuationDelta >= 0 ? 'success' : 'warning',
      message: `Valuation update: ${sign}$${Math.abs(valuationDelta).toLocaleString()} (now $${valuation.toLocaleString()}).`,
    });
  }
  if (nextPressure >= 0.45) {
    nextLogs.push({
      week: state.player.currentWeek,
      type: 'warning',
      message: `Board pressure is high (${Math.round(nextPressure * 100)}%). Growth expectations are increasing.`,
    });
  }

  return {
    ...nextState,
    logs: nextLogs,
  };
}
