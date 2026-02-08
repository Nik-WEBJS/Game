import {
  Niche, Product, Technology, Market, MonetizationStrategy, GameEvent, ISOStandard,
  TeamRole, FreelanceTaskType,
} from './types';

// ============================================================
// 3 Niches for MVP
// ============================================================
export const NICHES: Niche[] = [
  {
    id: 'fintech',
    name: 'FinTech',
    description: 'Financial technology — payments, banking, insurance.',
    baseDemand: 0.7,
    baseComplexity: 0.6,
    trendDecayRate: 0.005,
    unlocked: true,
  },
  {
    id: 'healthtech',
    name: 'HealthTech',
    description: 'Digital health — telemedicine, fitness, diagnostics.',
    baseDemand: 0.65,
    baseComplexity: 0.5,
    trendDecayRate: 0.003,
    unlocked: true,
  },
  {
    id: 'edtech',
    name: 'EdTech',
    description: 'Education technology — e-learning, LMS, tutoring.',
    baseDemand: 0.6,
    baseComplexity: 0.35,
    trendDecayRate: 0.004,
    unlocked: true,
  },
  {
    id: 'gamedev',
    name: 'GameDev',
    description: 'Game development — mobile, PC, console games.',
    baseDemand: 0.75,
    baseComplexity: 0.55,
    trendDecayRate: 0.006,
    unlocked: true,
  },
  {
    id: 'ecommerce',
    name: 'E-Commerce',
    description: 'Online retail — storefronts, logistics, delivery.',
    baseDemand: 0.8,
    baseComplexity: 0.45,
    trendDecayRate: 0.004,
    unlocked: true,
  },
  {
    id: 'cybersec',
    name: 'CyberSecurity',
    description: 'Security solutions — threat detection, compliance, audits.',
    baseDemand: 0.6,
    baseComplexity: 0.7,
    trendDecayRate: 0.002,
    unlocked: true,
  },
];

// ============================================================
// Products (each has fit coefficients per niche)
// ============================================================
export const PRODUCTS: Product[] = [
  {
    id: 'saas_platform',
    name: 'SaaS Platform',
    description: 'Cloud-based subscription software.',
    quality: 0.3,
    nicheFit: { fintech: 1.4, healthtech: 1.1, edtech: 1.3, gamedev: 0.6, ecommerce: 1.2, cybersec: 1.3 },
    monetizationEfficiency: 0.7,
  },
  {
    id: 'mobile_app',
    name: 'Mobile App',
    description: 'Consumer-facing mobile application.',
    quality: 0.25,
    nicheFit: { fintech: 1.0, healthtech: 1.4, edtech: 1.2, gamedev: 1.5, ecommerce: 1.1, cybersec: 0.7 },
    monetizationEfficiency: 0.6,
  },
  {
    id: 'marketplace',
    name: 'Marketplace',
    description: 'Two-sided platform connecting buyers and sellers.',
    quality: 0.25,
    nicheFit: { fintech: 1.1, healthtech: 0.9, edtech: 1.5, gamedev: 0.8, ecommerce: 1.6, cybersec: 0.5 },
    monetizationEfficiency: 0.65,
  },
  {
    id: 'api_service',
    name: 'API Service',
    description: 'Developer-facing API and SDK platform.',
    quality: 0.3,
    nicheFit: { fintech: 1.3, healthtech: 1.0, edtech: 0.8, gamedev: 1.0, ecommerce: 1.1, cybersec: 1.5 },
    monetizationEfficiency: 0.75,
  },
  {
    id: 'desktop_app',
    name: 'Desktop Application',
    description: 'Native desktop software for power users.',
    quality: 0.35,
    nicheFit: { fintech: 1.0, healthtech: 0.8, edtech: 1.0, gamedev: 1.3, ecommerce: 0.6, cybersec: 1.4 },
    monetizationEfficiency: 0.65,
  },
];

// ============================================================
// Technologies
// ============================================================
export const TECHNOLOGIES: Technology[] = [
  {
    id: 'cloud_infra',
    name: 'Cloud Infrastructure',
    description: 'AWS/GCP/Azure hosting and scaling.',
    cost: 5000,
    complexityAdd: 0.1,
    qualityBonus: 0.1,
    synergyWith: ['microservices', 'ai_ml'],
  },
  {
    id: 'microservices',
    name: 'Microservices',
    description: 'Distributed architecture for scalability.',
    cost: 8000,
    complexityAdd: 0.2,
    qualityBonus: 0.15,
    synergyWith: ['cloud_infra'],
  },
  {
    id: 'ai_ml',
    name: 'AI / Machine Learning',
    description: 'Intelligent features and automation.',
    cost: 12000,
    complexityAdd: 0.25,
    qualityBonus: 0.2,
    synergyWith: ['cloud_infra'],
  },
  {
    id: 'blockchain',
    name: 'Blockchain',
    description: 'Decentralized ledger for trust and transparency.',
    cost: 10000,
    complexityAdd: 0.3,
    qualityBonus: 0.1,
    synergyWith: [],
  },
  {
    id: 'cybersecurity',
    name: 'Cybersecurity Suite',
    description: 'Advanced security and compliance tooling.',
    cost: 7000,
    complexityAdd: 0.1,
    qualityBonus: 0.12,
    synergyWith: ['cloud_infra'],
  },
];

// ============================================================
// 1 Market for MVP
// ============================================================
export const MARKETS: Market[] = [
  {
    id: 'domestic',
    name: 'Domestic Market',
    description: 'Your home country. Easiest entry, moderate demand.',
    accessModifier: 1.0,
    demandMultiplier: 1.0,
    isoRequired: [],
  },
  {
    id: 'europe',
    name: 'European Market',
    description: 'EU market. High demand, requires ISO compliance.',
    accessModifier: 0.8,
    demandMultiplier: 1.4,
    isoRequired: ['iso_9001'],
  },
  {
    id: 'asia',
    name: 'Asian Market',
    description: 'Fast-growing Asian markets. High competition, huge potential.',
    accessModifier: 0.6,
    demandMultiplier: 1.8,
    isoRequired: [],
  },
];

// ============================================================
// Monetization Strategies
// ============================================================
export const MONETIZATIONS: MonetizationStrategy[] = [
  {
    id: 'subscription',
    name: 'Subscription (SaaS)',
    description: 'Recurring monthly/annual fees. Stable, predictable.',
    efficiency: 0.75,
    riskModifier: -0.05,
  },
  {
    id: 'freemium',
    name: 'Freemium',
    description: 'Free base + paid premium features. High reach, low conversion.',
    efficiency: 0.45,
    riskModifier: 0.05,
  },
  {
    id: 'transaction_fee',
    name: 'Transaction Fee',
    description: 'Take a cut of each transaction. Scales with volume.',
    efficiency: 0.65,
    riskModifier: 0.0,
  },
  {
    id: 'advertising',
    name: 'Advertising',
    description: 'Ad-supported model. Free for users, revenue from impressions.',
    efficiency: 0.35,
    riskModifier: 0.1,
  },
  {
    id: 'licensing',
    name: 'Enterprise Licensing',
    description: 'Sell licenses to businesses. High revenue per deal, slow sales.',
    efficiency: 0.85,
    riskModifier: -0.08,
  },
];

// ============================================================
// ISO 9001 for MVP
// ============================================================
export function createISO9001(): ISOStandard {
  return {
    id: 'iso_9001',
    name: 'ISO 9001',
    description: 'Quality Management System — improves process quality, reduces risk, boosts reputation.',
    currentStage: 'none',
    stageProgress: 0,
    maintenanceCost: 2000,
    stabilizationBonus: 0.15,
    reputationBonus: 10,
    burnoutReduction: 0.1,
    failRisk: 0.05,
    certified: false,
    turnsInMaintenance: 0,
  };
}

// ============================================================
// Events Pool
// ============================================================
export const EVENTS_POOL: GameEvent[] = [
  // Market events
  {
    id: 'market_boom',
    type: 'market',
    title: 'Market Boom',
    description: 'Demand in your niche surges unexpectedly!',
    effects: { demandDelta: 0.15, reputationDelta: 5 },
    weight: 8,
  },
  {
    id: 'market_downturn',
    type: 'market',
    title: 'Market Downturn',
    description: 'Economic slowdown reduces demand across the board.',
    effects: { demandDelta: -0.12, moneyDelta: -3000 },
    weight: 7,
  },
  {
    id: 'new_competitor',
    type: 'market',
    title: 'New Competitor',
    description: 'A well-funded competitor enters your niche.',
    effects: { demandDelta: -0.08, riskDelta: 0.1 },
    weight: 10,
  },
  // Internal events
  {
    id: 'team_conflict',
    type: 'internal',
    title: 'Team Conflict',
    description: 'Internal disagreements slow down productivity.',
    effects: { burnoutDelta: 15, qualityDelta: -0.05 },
    condition: (state) => state.business.team.length >= 3,
    weight: 8,
  },
  {
    id: 'innovation_spark',
    type: 'internal',
    title: 'Innovation Spark',
    description: 'Your team discovers a breakthrough approach!',
    effects: { qualityDelta: 0.08, reputationDelta: 3 },
    condition: (state) => state.business.team.some(m => m.role === 'developer' && m.experience > 50),
    weight: 6,
  },
  // Crisis events
  {
    id: 'data_breach',
    type: 'crisis',
    title: 'Data Breach!',
    description: 'A security incident exposes customer data.',
    effects: { reputationDelta: -15, moneyDelta: -10000, riskDelta: 0.2 },
    condition: (state) => !state.business.technologies.includes('cybersecurity'),
    weight: 5,
  },
  {
    id: 'server_outage',
    type: 'crisis',
    title: 'Server Outage',
    description: 'Your infrastructure goes down for hours.',
    effects: { reputationDelta: -8, moneyDelta: -5000 },
    condition: (state) => !state.business.technologies.includes('cloud_infra'),
    weight: 6,
  },
  {
    id: 'regulatory_fine',
    type: 'crisis',
    title: 'Regulatory Fine',
    description: 'You failed a compliance check. Heavy fine imposed.',
    effects: { moneyDelta: -15000, reputationDelta: -10 },
    condition: (state) => !state.business.isoStandards.some(iso => iso.certified),
    weight: 4,
  },
  // Positive events
  {
    id: 'viral_growth',
    type: 'positive',
    title: 'Viral Growth',
    description: 'Your product goes viral on social media!',
    effects: { demandDelta: 0.2, reputationDelta: 10, moneyDelta: 8000 },
    condition: (state) => state.business.team.some(m => m.role === 'marketing'),
    weight: 4,
  },
  {
    id: 'media_feature',
    type: 'positive',
    title: 'Media Feature',
    description: 'A major publication features your company.',
    effects: { reputationDelta: 12, demandDelta: 0.1 },
    weight: 5,
  },
  {
    id: 'talent_arrives',
    type: 'positive',
    title: 'Talent Magnet',
    description: 'Your reputation attracts top talent — team morale soars.',
    effects: { burnoutDelta: -10, qualityDelta: 0.05 },
    condition: (state) => state.player.reputation > 60,
    weight: 5,
  },
  // ISO-specific events
  {
    id: 'iso_audit_surprise',
    type: 'iso',
    title: 'Surprise ISO Audit',
    description: 'An unscheduled audit checks your compliance.',
    effects: { isoProgressDelta: -15, moneyDelta: -3000 },
    condition: (state) => state.business.isoStandards.some(iso => iso.currentStage === 'maintenance'),
    weight: 5,
  },
  {
    id: 'iso_recognition',
    type: 'iso',
    title: 'ISO Excellence Award',
    description: 'Your quality management earns industry recognition.',
    effects: { reputationDelta: 15, moneyDelta: 5000 },
    condition: (state) => state.business.isoStandards.some(iso => iso.certified && iso.turnsInMaintenance > 8),
    weight: 3,
  },
];

// ============================================================
// Team member name pools
// ============================================================
const FIRST_NAMES = [
  'Alex', 'Jordan', 'Sam', 'Morgan', 'Casey', 'Riley', 'Quinn', 'Avery',
  'Taylor', 'Drew', 'Reese', 'Skyler', 'Dakota', 'Kai', 'Robin', 'Sage',
];

const LAST_NAMES = [
  'Chen', 'Patel', 'Kim', 'Müller', 'Silva', 'Tanaka', 'Okafor', 'Johansson',
  'Garcia', 'Novak', 'Ali', 'Petrov', 'Dubois', 'Nakamura', 'Kowalski', 'Reyes',
];

export function generateTeamMemberName(): string {
  const first = FIRST_NAMES[Math.floor(Math.random() * FIRST_NAMES.length)];
  const last = LAST_NAMES[Math.floor(Math.random() * LAST_NAMES.length)];
  return `${first} ${last}`;
}

export const ROLE_SALARIES: Record<string, number> = {
  developer: 1200,
  manager: 1000,
  qa: 800,
  security: 1100,
  marketing: 900,
};

export const ROLE_LABELS: Record<string, string> = {
  developer: 'Developer',
  manager: 'Manager',
  qa: 'QA Engineer',
  security: 'Security Specialist',
  marketing: 'Marketing',
};

// --- Freelance System Constants ---
export const BASE_CONTRACT_VALUE = 4000;

export const FREELANCE_OUTSOURCING_ROLE_MULT: Record<TeamRole, number> = {
  developer: 1.0,
  qa: 0.85,
  marketing: 1.1,
  security: 0.9,
  manager: 1.3,
};

export const FREELANCE_ROLE_SPEED: Record<TeamRole, Record<FreelanceTaskType, number>> = {
  developer: { outsourcing: 1.0, internal_help: 1.2 },
  qa:        { outsourcing: 0.8, internal_help: 1.1 },
  marketing: { outsourcing: 1.1, internal_help: 0.9 },
  security:  { outsourcing: 0.9, internal_help: 0.8 },
  manager:   { outsourcing: 1.2, internal_help: 1.0 },
};

export const FREELANCE_BURNOUT_PER_WEEK = { min: 3, max: 6 };
export const FREELANCE_QUALITY_BOOST_PER_WEEK = 0.006; // 0.6%

export const FREELANCE_DURATIONS: Record<FreelanceTaskType, { min: number; max: number }> = {
  outsourcing:   { min: 3, max: 6 },
  internal_help: { min: 2, max: 5 },
};
