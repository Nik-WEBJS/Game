import { CorporateRoundState, CorporateState, FundingRoundId } from './types';

export const FUNDING_ROUND_ORDER: FundingRoundId[] = ['pre_seed', 'seed', 'series_a', 'growth'];

export const FUNDING_ROUND_LABEL: Record<FundingRoundId, string> = {
  pre_seed: 'Pre-Seed',
  seed: 'Seed',
  series_a: 'Series A',
  growth: 'Growth',
};

export function createInitialCorporateRounds(): CorporateRoundState[] {
  return FUNDING_ROUND_ORDER.map((id) => ({
    id,
    raised: false,
    weekRaised: null,
    cashRaised: 0,
    equitySold: 0,
    postMoneyValuation: 0,
  }));
}

export function createInitialCorporateState(): CorporateState {
  return {
    founderEquity: 1,
    investorEquity: 0,
    cumulativeCashRaised: 0,
    valuation: 120000,
    boardPressure: 0,
    activeGoal: null,
    goalsCompleted: 0,
    goalsFailed: 0,
    nextGoalWeek: 8,
    nextGoalSeq: 1,
    rounds: createInitialCorporateRounds(),
    lastWeek: {
      valuationDelta: 0,
      boardPressureDelta: 0,
    },
  };
}
