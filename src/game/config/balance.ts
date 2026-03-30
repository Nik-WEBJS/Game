export const BALANCE = {
  saveVersion: 1,
  start: {
    money: 100000,
    reputation: 10,
  },
  time: {
    secondsPerWeekAt1x: 10,
  },
  employee: {
    pointsPerWeek: 0.02,
    workCycleWeeks: 1,
  },
  economy: {
    baseRevenueScale: 18000,
    infrastructureRate: 0.03,
    techComplexityCostMult: 500,
  },
  progression: {
    bankruptcyThreshold: -50000,
    ipoMoneyThreshold: 500000,
    ipoReputationThreshold: 80,
    marketDominanceReputation: 95,
    marketDominanceQuality: 0.9,
  },
} as const;

export type BalanceConfig = typeof BALANCE;
