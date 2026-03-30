import { CampaignMilestoneState, CompetitionState, CompetitorCompany } from './types';

const COMPETITOR_PREFIX = [
  'Nova', 'Vertex', 'Pulse', 'Orbit', 'Vector', 'Atlas', 'Nimbus', 'Grid', 'Apex', 'Signal', 'Neon', 'Quantum',
];
const COMPETITOR_SUFFIX = [
  'Labs', 'Systems', 'Works', 'Network', 'Platform', 'Stack', 'Dynamics', 'Cloud', 'Forge', 'Collective',
];

function pick<T>(arr: T[]): T {
  return arr[Math.floor(Math.random() * arr.length)];
}

function createCompetitorName(existing: Set<string>): string {
  for (let i = 0; i < 20; i++) {
    const name = `${pick(COMPETITOR_PREFIX)} ${pick(COMPETITOR_SUFFIX)}`;
    if (!existing.has(name)) return name;
  }
  return `Competitor ${existing.size + 1}`;
}

function createCompetitor(id: string, nicheId: string, existingNames: Set<string>): CompetitorCompany {
  const name = createCompetitorName(existingNames);
  existingNames.add(name);
  return {
    id,
    name,
    nicheId,
    users: 280 + Math.floor(Math.random() * 1300),
    growth: 0.03 + Math.random() * 0.08,
    quality: 0.35 + Math.random() * 0.35,
    reputation: 18 + Math.floor(Math.random() * 45),
    pressure: 0.08 + Math.random() * 0.14,
  };
}

export function createInitialCompetitionState(nicheId: string | null): CompetitionState {
  const existingNames = new Set<string>();
  const competitors: CompetitorCompany[] = nicheId
    ? Array.from({ length: 5 }).map((_, idx) => createCompetitor(`comp_${idx + 1}`, nicheId, existingNames))
    : [];

  return {
    competitors,
    lastWeek: {
      totalUsers: 0,
      playerUsers: 0,
      playerMarketShare: 0,
      playerRank: competitors.length + 1,
      marketPressure: 0,
      lastRankDelta: 0,
      topCompetitorName: competitors[0]?.name ?? null,
    },
    pendingPressureEvents: [],
  };
}

export interface CampaignMilestoneDefinition {
  id: string;
  title: string;
  description: string;
  rewardMoney: number;
  rewardReputation: number;
}

export const CAMPAIGN_MILESTONES: CampaignMilestoneDefinition[] = [
  {
    id: 'unlock_first_feature',
    title: 'Unlock First Feature',
    description: 'Install a second product feature.',
    rewardMoney: 3000,
    rewardReputation: 2,
  },
  {
    id: 'reach_1k_active_users',
    title: 'Reach 1K Active Users',
    description: 'Grow to at least 1,000 active users.',
    rewardMoney: 7000,
    rewardReputation: 4,
  },
  {
    id: 'survive_first_overload',
    title: 'Survive First Overload',
    description: 'Experience server load above 100% and keep operating.',
    rewardMoney: 9000,
    rewardReputation: 4,
  },
  {
    id: 'hire_first_ops_specialist',
    title: 'Hire Ops Specialist',
    description: 'Hire a QA or Security team member.',
    rewardMoney: 5000,
    rewardReputation: 3,
  },
  {
    id: 'improve_satisfaction',
    title: 'Raise Satisfaction',
    description: 'Reach product satisfaction of 70% or more.',
    rewardMoney: 9000,
    rewardReputation: 6,
  },
  {
    id: 'execute_first_mna',
    title: 'Execute First M&A Move',
    description: 'Complete any M&A lite action against a competitor.',
    rewardMoney: 12000,
    rewardReputation: 8,
  },
];

export function createInitialCampaignState(): CampaignMilestoneState {
  return {
    activeId: CAMPAIGN_MILESTONES[0]?.id ?? null,
    completedIds: [],
    discoveredIds: CAMPAIGN_MILESTONES.length > 0 ? [CAMPAIGN_MILESTONES[0].id] : [],
    lastCompletedWeek: null,
    flags: {
      hadOverload: false,
      usedMna: false,
    },
  };
}

