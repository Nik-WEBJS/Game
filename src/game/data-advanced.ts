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
  // GameDev subtypes
  { id: 'mobile_games', parentNicheId: 'gamedev', name: 'Mobile Games', description: 'Casual and hyper-casual mobile games.', demandMod: 0.1, complexityMod: -0.1 },
  { id: 'pc_games', parentNicheId: 'gamedev', name: 'PC Games', description: 'Indie and AA PC titles.', demandMod: 0.05, complexityMod: 0.15 },
  { id: 'game_tools', parentNicheId: 'gamedev', name: 'Game Tools', description: 'Engines, SDKs, and dev tools.', demandMod: 0.08, complexityMod: 0.1 },
  // E-Commerce subtypes
  { id: 'storefront', parentNicheId: 'ecommerce', name: 'Storefront', description: 'Online store builder.', demandMod: 0.1, complexityMod: -0.05 },
  { id: 'logistics', parentNicheId: 'ecommerce', name: 'Logistics', description: 'Delivery and fulfillment.', demandMod: 0.05, complexityMod: 0.15 },
  { id: 'dropshipping', parentNicheId: 'ecommerce', name: 'Dropshipping', description: 'No-inventory retail model.', demandMod: 0.12, complexityMod: -0.1 },
  // CyberSecurity subtypes
  { id: 'threat_detect', parentNicheId: 'cybersec', name: 'Threat Detection', description: 'Real-time threat monitoring.', demandMod: 0.08, complexityMod: 0.1 },
  { id: 'compliance', parentNicheId: 'cybersec', name: 'Compliance', description: 'Regulatory compliance automation.', demandMod: 0.05, complexityMod: 0.05 },
  { id: 'pentest', parentNicheId: 'cybersec', name: 'Penetration Testing', description: 'Automated security audits.', demandMod: 0.1, complexityMod: 0.15 },
];

// ============================================================
// Business Styles
// ============================================================
export const BUSINESS_STYLES: BusinessStyle[] = [
  {
    id: 'bootstrapped',
    name: 'Bootstrapped',
    description: 'Self-funded. Lower costs, slower growth, full control.',
    modifiers: { revenueMod: 1.0, costMod: 0.85, riskMod: -0.05, growthMod: 0.8, reputationMod: 1.0, startingMoney: 20000 },
  },
  {
    id: 'vc_backed',
    name: 'VC-Backed',
    description: 'Venture capital funded. More money, faster growth, higher burn.',
    modifiers: { revenueMod: 1.1, costMod: 1.2, riskMod: 0.05, growthMod: 1.3, reputationMod: 1.1, startingMoney: 50000 },
  },
  {
    id: 'enterprise_first',
    name: 'Enterprise-First',
    description: 'Focus on B2B enterprise clients. Stable revenue, slow start.',
    modifiers: { revenueMod: 1.2, costMod: 1.1, riskMod: -0.1, growthMod: 0.7, reputationMod: 1.2, startingMoney: 35000 },
  },
];

// ============================================================
// Technology / Influence Tree
// ============================================================
export function createTechTree(): TechTreeNode[] {
  return [
    // --- Tech Core branch (5 nodes) ---
    {
      id: 'tt_architecture',
      branch: 'tech_core',
      name: 'Software Architecture',
      description: 'Foundational architecture patterns.',
      cost: 3000,
      weeksToResearch: 3,
      requires: [],
      effects: { qualityMod: 0.06, riskMod: -0.03 },
      unlocked: true,
      researching: false,
      researchProgress: 0,
      completed: false,
    },
    {
      id: 'tt_infra',
      branch: 'tech_core',
      name: 'Cloud Infrastructure',
      description: 'Scalable cloud hosting and CDN.',
      cost: 6000,
      weeksToResearch: 4,
      requires: ['tt_architecture'],
      effects: { qualityMod: 0.05, riskMod: -0.06 },
      unlocked: false,
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
      weeksToResearch: 6,
      requires: ['tt_infra'],
      effects: { qualityMod: 0.1, growthMod: 0.06 },
      unlocked: false,
      researching: false,
      researchProgress: 0,
      completed: false,
    },
    {
      id: 'tt_security',
      branch: 'tech_core',
      name: 'Security Hardening',
      description: 'Enterprise-grade security and encryption.',
      cost: 8000,
      weeksToResearch: 4,
      requires: ['tt_infra'],
      effects: { riskMod: -0.1, reputationMod: 0.04 },
      unlocked: false,
      researching: false,
      researchProgress: 0,
      completed: false,
    },
    {
      id: 'tt_microservices',
      branch: 'tech_core',
      name: 'Microservices',
      description: 'Distributed architecture for massive scale.',
      cost: 18000,
      weeksToResearch: 7,
      requires: ['tt_ai_ml', 'tt_security'],
      effects: { qualityMod: 0.08, riskMod: -0.05, growthMod: 0.04 },
      unlocked: false,
      researching: false,
      researchProgress: 0,
      completed: false,
      requiredReputation: 50,
    },
    // --- Marketing & Influence branch (5 nodes) ---
    {
      id: 'tt_social',
      branch: 'marketing_influence',
      name: 'Social Media Presence',
      description: 'Regular social media posts and engagement.',
      cost: 1500,
      weeksToResearch: 2,
      requires: [],
      effects: { userGrowthMod: 0.08, growthMod: 0.04 },
      unlocked: true,
      researching: false,
      researchProgress: 0,
      completed: false,
    },
    {
      id: 'tt_shorts',
      branch: 'marketing_influence',
      name: 'Short-Form Videos',
      description: 'Viral short video content on TikTok/Reels.',
      cost: 3500,
      weeksToResearch: 3,
      requires: ['tt_social'],
      effects: { viralityMod: 0.12, userGrowthMod: 0.06 },
      unlocked: false,
      researching: false,
      researchProgress: 0,
      completed: false,
    },
    {
      id: 'tt_community',
      branch: 'marketing_influence',
      name: 'Community Building',
      description: 'Discord/forum community for user retention.',
      cost: 5000,
      weeksToResearch: 3,
      requires: ['tt_social'],
      effects: { reputationMod: 0.06, growthMod: 0.03 },
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
      requires: ['tt_shorts', 'tt_community'],
      effects: { reputationMod: 0.08, growthMod: 0.04 },
      unlocked: false,
      researching: false,
      researchProgress: 0,
      completed: false,
      requiredReputation: 40,
    },
    {
      id: 'tt_conferences',
      branch: 'marketing_influence',
      name: 'Conferences & Sponsorships',
      description: 'Industry events attract top talent and press.',
      cost: 15000,
      weeksToResearch: 5,
      requires: ['tt_documentary'],
      effects: { talentAccessMod: 0.15, reputationMod: 0.06, growthMod: 0.03 },
      unlocked: false,
      researching: false,
      researchProgress: 0,
      completed: false,
      requiredReputation: 60,
    },
    // --- Operations & Process branch (5 nodes) ---
    {
      id: 'tt_agile',
      branch: 'operations_process',
      name: 'Agile Methodology',
      description: 'Scrum/Kanban for faster iteration.',
      cost: 2000,
      weeksToResearch: 2,
      requires: [],
      effects: { qualityMod: 0.03, riskMod: -0.03 },
      unlocked: true,
      researching: false,
      researchProgress: 0,
      completed: false,
    },
    {
      id: 'tt_ci_cd',
      branch: 'operations_process',
      name: 'CI/CD Pipeline',
      description: 'Automated testing and deployment.',
      cost: 5000,
      weeksToResearch: 3,
      requires: ['tt_agile'],
      effects: { qualityMod: 0.05, riskMod: -0.04 },
      unlocked: false,
      researching: false,
      researchProgress: 0,
      completed: false,
    },
    {
      id: 'tt_analytics',
      branch: 'operations_process',
      name: 'Product Analytics',
      description: 'Data-driven decisions with user analytics.',
      cost: 4000,
      weeksToResearch: 3,
      requires: ['tt_agile'],
      effects: { growthMod: 0.05, userGrowthMod: 0.04 },
      unlocked: false,
      researching: false,
      researchProgress: 0,
      completed: false,
    },
    {
      id: 'tt_devops',
      branch: 'operations_process',
      name: 'DevOps Culture',
      description: 'Unified dev and ops for reliability.',
      cost: 10000,
      weeksToResearch: 5,
      requires: ['tt_ci_cd'],
      effects: { riskMod: -0.08, qualityMod: 0.04 },
      unlocked: false,
      researching: false,
      researchProgress: 0,
      completed: false,
      requiredReputation: 35,
    },
    {
      id: 'tt_automation',
      branch: 'operations_process',
      name: 'Full Automation',
      description: 'Automated workflows reduce costs and errors.',
      cost: 20000,
      weeksToResearch: 7,
      requires: ['tt_devops', 'tt_analytics'],
      effects: { riskMod: -0.06, qualityMod: 0.06, growthMod: 0.03 },
      unlocked: false,
      researching: false,
      researchProgress: 0,
      completed: false,
      requiredReputation: 55,
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
  developer: 1200,
  manager: 1000,
  qa: 800,
  security: 1100,
  marketing: 900,
};

const BASE_HIRE_COSTS: Record<TeamRole, number> = {
  developer: 2500,
  manager: 2000,
  qa: 1500,
  security: 2200,
  marketing: 1800,
};

// Reputation unlocks better rarity tiers:
// 0-29: only common+uncommon, 30-59: +rare, 60+: +legendary
function pickRarity(reputation: number = 50): typeof RARITY_WEIGHTS[number] {
  const available = RARITY_WEIGHTS.filter(r => {
    if (r.rarity === 'legendary' && reputation < 60) return false;
    if (r.rarity === 'rare' && reputation < 30) return false;
    return true;
  });
  // Higher reputation boosts rare/legendary weights
  const repBonus = Math.max(0, reputation - 30) / 70; // 0..1
  const adjusted = available.map(r => ({
    ...r,
    weight: r.rarity === 'rare' || r.rarity === 'legendary'
      ? r.weight * (1 + repBonus * 2)
      : r.weight,
  }));
  const total = adjusted.reduce((s, r) => s + r.weight, 0);
  let roll = Math.random() * total;
  for (const r of adjusted) {
    roll -= r.weight;
    if (roll <= 0) return RARITY_WEIGHTS.find(rw => rw.rarity === r.rarity)!;
  }
  return RARITY_WEIGHTS[0];
}

function randRange(min: number, max: number): number {
  return min + Math.random() * (max - min);
}

export function generateCandidate(role?: TeamRole, reputation?: number): MarketCandidate {
  const candidateRole = role ?? ALL_ROLES[Math.floor(Math.random() * ALL_ROLES.length)];
  const rarityDef = pickRarity(reputation);
  const talent = Math.round(randRange(rarityDef.talentRange[0], rarityDef.talentRange[1]) * 100) / 100;
  const hasTrait = Math.random() < rarityDef.traitChance;
  const trait = hasTrait ? ALL_TRAIT_IDS[Math.floor(Math.random() * ALL_TRAIT_IDS.length)] : null;
  const experience = Math.round(randRange(10, 40) + talent * 40);
  const burnoutResistance = Math.round(randRange(0.2, 0.5 + talent * 0.3) * 100) / 100;

  return {
    id: `cand_${Date.now()}_${Math.random().toString(36).slice(2, 6)}`,
    role: candidateRole,
    name: generateTeamMemberName(),
    salary: Math.round(BASE_SALARIES[candidateRole] * rarityDef.salaryMul),
    hireCost: Math.round(BASE_HIRE_COSTS[candidateRole] * rarityDef.hireCostMul),
    experience,
    talent,
    burnoutResistance,
    trait,
    rarity: rarityDef.rarity,
  };
}

// Generate 5 candidates per role (25 total), quality scales with reputation
export function generateMarketPool(count: number = 5, reputation: number = 50): MarketCandidate[] {
  const candidates: MarketCandidate[] = [];
  for (const role of ALL_ROLES) {
    for (let i = 0; i < count; i++) {
      candidates.push(generateCandidate(role, reputation));
    }
  }
  return candidates;
}

export const MARKET_REFRESH_INTERVAL = 4; // refresh every N weeks
