import {
  ZoneDefinition, TraitDefinition, NicheVariant, BusinessStyle,
  TechTreeNode, FurnitureItem, MarketCandidate, TeamRole, TraitId, CandidateRarity,
} from './types';
import { generateTeamMemberName } from './data';

// ============================================================
// Office Zones
// ============================================================
export const ZONES: ZoneDefinition[] = [
  {
    id: 'development',
    name: 'Development Zone',
    description: 'Focus on code quality and development speed.',
    bonuses: { qualityMod: 0.1, stabilityMod: 0.05 },
  },
  {
    id: 'marketing',
    name: 'Marketing Zone',
    description: 'Boost growth and attract positive events.',
    bonuses: { growthMod: 0.1, eventChanceMod: 0.15 },
  },
  {
    id: 'security',
    name: 'Security Zone',
    description: 'Reduce crisis risk and improve stability.',
    bonuses: { riskMod: -0.1, stabilityMod: 0.08 },
  },
  {
    id: 'qa',
    name: 'QA Zone',
    description: 'Reduce bugs and improve product stability.',
    bonuses: { stabilityMod: 0.12, qualityMod: 0.05 },
  },
];

// ============================================================
// Employee Traits
// ============================================================
export const TRAITS: TraitDefinition[] = [
  {
    id: 'visionary',
    name: 'Visionary',
    description: '+5% innovation bonus.',
    effects: { innovationMod: 0.05 },
  },
  {
    id: 'workaholic',
    name: 'Workaholic',
    description: '+experience gain, but +burnout.',
    effects: { experienceGainMod: 0.3, burnoutGainMod: 0.2 },
  },
  {
    id: 'influencer',
    name: 'Influencer',
    description: 'Boosts marketing activities.',
    effects: { marketingMod: 0.15 },
  },
  {
    id: 'perfectionist',
    name: 'Perfectionist',
    description: '+quality, but slower work.',
    effects: { qualityMod: 0.08, speedMod: -0.1 },
  },
  {
    id: 'mentor',
    name: 'Mentor',
    description: 'Boosts morale of nearby team members.',
    effects: { moraleMod: 0.1 },
  },
  {
    id: 'resilient',
    name: 'Resilient',
    description: 'Significantly slower burnout gain.',
    effects: { burnoutGainMod: -0.3 },
  },
  {
    id: 'creative',
    name: 'Creative',
    description: '+innovation and +quality.',
    effects: { innovationMod: 0.03, qualityMod: 0.04 },
  },
  {
    id: 'analytical',
    name: 'Analytical',
    description: '+quality through systematic approach.',
    effects: { qualityMod: 0.06, speedMod: -0.05 },
  },
];

// ============================================================
// Niche Variants (subtypes)
// ============================================================
export const NICHE_VARIANTS: NicheVariant[] = [
  // FinTech subtypes
  { id: 'payments', parentNicheId: 'fintech', name: 'Payments', description: 'Digital payment processing.', demandMod: 0.1, complexityMod: 0.05 },
  { id: 'lending', parentNicheId: 'fintech', name: 'Lending', description: 'P2P and digital lending.', demandMod: 0.05, complexityMod: 0.1 },
  { id: 'crypto', parentNicheId: 'fintech', name: 'Crypto', description: 'Cryptocurrency services.', demandMod: 0.15, complexityMod: 0.2 },
  // HealthTech subtypes
  { id: 'telemedicine', parentNicheId: 'healthtech', name: 'Telemedicine', description: 'Remote medical consultations.', demandMod: 0.1, complexityMod: 0.05 },
  { id: 'fitness', parentNicheId: 'healthtech', name: 'Fitness', description: 'Fitness tracking and coaching.', demandMod: 0.05, complexityMod: -0.1 },
  { id: 'diagnostics', parentNicheId: 'healthtech', name: 'Diagnostics', description: 'AI-powered diagnostics.', demandMod: 0.08, complexityMod: 0.15 },
  // EdTech subtypes
  { id: 'elearning', parentNicheId: 'edtech', name: 'E-Learning', description: 'Online courses and MOOCs.', demandMod: 0.08, complexityMod: -0.05 },
  { id: 'lms', parentNicheId: 'edtech', name: 'LMS', description: 'Learning management systems.', demandMod: 0.05, complexityMod: 0.1 },
  { id: 'tutoring', parentNicheId: 'edtech', name: 'Tutoring', description: 'One-on-one digital tutoring.', demandMod: 0.12, complexityMod: 0.0 },
];

// ============================================================
// Business Styles
// ============================================================
export const BUSINESS_STYLES: BusinessStyle[] = [
  {
    id: 'bootstrapped',
    name: 'Bootstrapped',
    description: 'Self-funded. Lower costs, slower growth, full control.',
    modifiers: { revenueMod: 1.0, costMod: 0.85, riskMod: -0.05, growthMod: 0.8, reputationMod: 1.0, startingMoney: 40000 },
  },
  {
    id: 'vc_backed',
    name: 'VC-Backed',
    description: 'Venture capital funded. More money, faster growth, higher burn.',
    modifiers: { revenueMod: 1.1, costMod: 1.2, riskMod: 0.05, growthMod: 1.3, reputationMod: 1.1, startingMoney: 80000 },
  },
  {
    id: 'enterprise_first',
    name: 'Enterprise-First',
    description: 'Focus on B2B enterprise clients. Stable revenue, slow start.',
    modifiers: { revenueMod: 1.2, costMod: 1.1, riskMod: -0.1, growthMod: 0.7, reputationMod: 1.2, startingMoney: 60000 },
  },
];

// ============================================================
// Technology / Influence Tree
// ============================================================
export function createTechTree(): TechTreeNode[] {
  return [
    // --- Tech Core branch ---
    {
      id: 'tt_architecture',
      branch: 'tech_core',
      name: 'Software Architecture',
      description: 'Foundational architecture patterns.',
      cost: 5000,
      weeksToResearch: 3,
      requires: [],
      effects: { qualityMod: 0.08, riskMod: -0.05 },
      unlocked: true,
      researching: false,
      researchProgress: 0,
      completed: false,
    },
    {
      id: 'tt_ai_ml',
      branch: 'tech_core',
      name: 'AI / ML Integration',
      description: 'Machine learning capabilities.',
      cost: 12000,
      weeksToResearch: 5,
      requires: ['tt_architecture'],
      effects: { qualityMod: 0.12, growthMod: 0.08 },
      unlocked: false,
      researching: false,
      researchProgress: 0,
      completed: false,
    },
    {
      id: 'tt_infra',
      branch: 'tech_core',
      name: 'Advanced Infrastructure',
      description: 'Scalable cloud infrastructure.',
      cost: 8000,
      weeksToResearch: 4,
      requires: ['tt_architecture'],
      effects: { qualityMod: 0.06, riskMod: -0.08 },
      unlocked: false,
      researching: false,
      researchProgress: 0,
      completed: false,
    },
    {
      id: 'tt_security',
      branch: 'tech_core',
      name: 'Security Hardening',
      description: 'Enterprise-grade security.',
      cost: 7000,
      weeksToResearch: 3,
      requires: ['tt_infra'],
      effects: { riskMod: -0.12, reputationMod: 0.05 },
      unlocked: false,
      researching: false,
      researchProgress: 0,
      completed: false,
    },
    // --- Marketing & Influence branch ---
    {
      id: 'tt_social',
      branch: 'marketing_influence',
      name: 'Social Media Posts',
      description: 'Regular social media presence.',
      cost: 2000,
      weeksToResearch: 2,
      requires: [],
      effects: { userGrowthMod: 0.1, growthMod: 0.05 },
      unlocked: true,
      researching: false,
      researchProgress: 0,
      completed: false,
    },
    {
      id: 'tt_shorts',
      branch: 'marketing_influence',
      name: 'Short-Form Videos',
      description: 'Viral short video content.',
      cost: 4000,
      weeksToResearch: 3,
      requires: ['tt_social'],
      effects: { viralityMod: 0.15, userGrowthMod: 0.08 },
      unlocked: false,
      researching: false,
      researchProgress: 0,
      completed: false,
    },
    {
      id: 'tt_documentary',
      branch: 'marketing_influence',
      name: 'Developer Documentaries',
      description: 'Behind-the-scenes content builds trust.',
      cost: 8000,
      weeksToResearch: 4,
      requires: ['tt_shorts'],
      effects: { reputationMod: 0.1, growthMod: 0.05 },
      unlocked: false,
      researching: false,
      researchProgress: 0,
      completed: false,
      requiredReputation: 40,
    },
    {
      id: 'tt_conferences',
      branch: 'marketing_influence',
      name: 'Conferences & Shows',
      description: 'Industry events attract top talent.',
      cost: 15000,
      weeksToResearch: 5,
      requires: ['tt_documentary'],
      effects: { talentAccessMod: 0.2, reputationMod: 0.08 },
      unlocked: false,
      researching: false,
      researchProgress: 0,
      completed: false,
      requiredReputation: 60,
    },
  ];
}

// ============================================================
// Furniture Catalog
// ============================================================
export const FURNITURE_CATALOG: Omit<FurnitureItem, 'id' | 'position' | 'assignedEmployeeId'>[] = [
  {
    type: 'desk',
    name: 'Work Desk',
    description: '+1 employee slot.',
    cost: 2000,
    gridSize: [1, 1],
    effects: { teamSlotsMod: 1 },
  },
  {
    type: 'meeting_room',
    name: 'Meeting Room',
    description: 'Improves team morale.',
    cost: 5000,
    gridSize: [2, 2],
    effects: { moraleMod: 0.08 },
  },
  {
    type: 'server_room',
    name: 'Server Room',
    description: 'Improves tech quality.',
    cost: 8000,
    gridSize: [2, 1],
    effects: { qualityMod: 0.06 },
  },
  {
    type: 'lounge',
    name: 'Lounge Area',
    description: 'Reduces team burnout.',
    cost: 4000,
    gridSize: [2, 1],
    effects: { burnoutMod: -0.08 },
  },
  {
    type: 'stage',
    name: 'Presentation Stage',
    description: 'Boosts company reputation.',
    cost: 10000,
    gridSize: [2, 2],
    effects: { reputationMod: 0.05 },
  },
];

// ============================================================
// Employee Market Generation
// ============================================================
const RARITY_WEIGHTS: { rarity: CandidateRarity; weight: number; talentRange: [number, number]; traitChance: number; salaryMul: number; hireCostMul: number }[] = [
  { rarity: 'common', weight: 50, talentRange: [0.2, 0.5], traitChance: 0.2, salaryMul: 1.0, hireCostMul: 1.0 },
  { rarity: 'uncommon', weight: 30, talentRange: [0.4, 0.7], traitChance: 0.5, salaryMul: 1.2, hireCostMul: 1.3 },
  { rarity: 'rare', weight: 15, talentRange: [0.6, 0.85], traitChance: 0.8, salaryMul: 1.5, hireCostMul: 1.8 },
  { rarity: 'legendary', weight: 5, talentRange: [0.8, 1.0], traitChance: 1.0, salaryMul: 2.0, hireCostMul: 2.5 },
];

const ALL_ROLES: TeamRole[] = ['developer', 'manager', 'qa', 'security', 'marketing'];
const ALL_TRAIT_IDS: TraitId[] = ['visionary', 'workaholic', 'influencer', 'perfectionist', 'mentor', 'resilient', 'creative', 'analytical'];

const BASE_SALARIES: Record<TeamRole, number> = {
  developer: 4000,
  manager: 3500,
  qa: 3000,
  security: 3800,
  marketing: 3200,
};

const BASE_HIRE_COSTS: Record<TeamRole, number> = {
  developer: 8000,
  manager: 7000,
  qa: 6000,
  security: 7600,
  marketing: 6400,
};

function pickRarity(): typeof RARITY_WEIGHTS[number] {
  const total = RARITY_WEIGHTS.reduce((s, r) => s + r.weight, 0);
  let roll = Math.random() * total;
  for (const r of RARITY_WEIGHTS) {
    roll -= r.weight;
    if (roll <= 0) return r;
  }
  return RARITY_WEIGHTS[0];
}

function randRange(min: number, max: number): number {
  return min + Math.random() * (max - min);
}

export function generateCandidate(): MarketCandidate {
  const role = ALL_ROLES[Math.floor(Math.random() * ALL_ROLES.length)];
  const rarityDef = pickRarity();
  const talent = Math.round(randRange(rarityDef.talentRange[0], rarityDef.talentRange[1]) * 100) / 100;
  const hasTrait = Math.random() < rarityDef.traitChance;
  const trait = hasTrait ? ALL_TRAIT_IDS[Math.floor(Math.random() * ALL_TRAIT_IDS.length)] : null;
  const experience = Math.round(randRange(10, 40) + talent * 40);
  const burnoutResistance = Math.round(randRange(0.2, 0.5 + talent * 0.3) * 100) / 100;

  return {
    id: `cand_${Date.now()}_${Math.random().toString(36).slice(2, 6)}`,
    role,
    name: generateTeamMemberName(),
    salary: Math.round(BASE_SALARIES[role] * rarityDef.salaryMul),
    hireCost: Math.round(BASE_HIRE_COSTS[role] * rarityDef.hireCostMul),
    experience,
    talent,
    burnoutResistance,
    trait,
    rarity: rarityDef.rarity,
  };
}

export function generateMarketPool(count: number = 5): MarketCandidate[] {
  return Array.from({ length: count }, () => generateCandidate());
}

export const MARKET_REFRESH_INTERVAL = 4; // refresh every N weeks
