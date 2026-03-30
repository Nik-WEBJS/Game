// ============================================================
// Business Tycoon — Core Type Definitions
// ============================================================

// --- Time ---
export type GameSpeed = 0 | 1 | 2 | 3; // 0=paused, 1=normal, 2=fast, 3=ultra

// --- Player ---
export interface Player {
  money: number;
  reputation: number;
  experience: number;
  unlockedNiches: string[];
  unlockedProducts: string[];
  unlockedTechnologies: string[];
  currentWeek: number;
  gameSpeed: GameSpeed;
  weekProgress: number;       // 0..1, fraction of current week elapsed
  totalTimePlayed: number;    // total seconds of game time
}

// --- Office Zones ---
export type ZoneId = 'development' | 'marketing' | 'security' | 'qa';

export interface ZoneDefinition {
  id: ZoneId;
  name: string;
  description: string;
  bonuses: Partial<ZoneBonuses>;
}

export interface ZoneBonuses {
  qualityMod: number;       // +quality
  growthMod: number;        // +growth
  riskMod: number;          // +/- risk
  stabilityMod: number;     // +stability (inverse of bugs)
  eventChanceMod: number;   // +chance of positive events
}

// --- Team ---
export type TeamRole = 'developer' | 'manager' | 'qa' | 'security' | 'marketing';

export type TraitId =
  | 'visionary'
  | 'workaholic'
  | 'influencer'
  | 'perfectionist'
  | 'mentor'
  | 'resilient'
  | 'creative'
  | 'analytical';

export interface TraitDefinition {
  id: TraitId;
  name: string;
  description: string;
  effects: Partial<TraitEffects>;
}

export interface TraitEffects {
  innovationMod: number;
  experienceGainMod: number;
  burnoutGainMod: number;
  qualityMod: number;
  speedMod: number;
  marketingMod: number;
  moraleMod: number;
}

// --- Freelance ---
export type FreelanceTaskType = 'outsourcing' | 'internal_help';

export interface FreelanceTask {
  id: string;
  type: FreelanceTaskType;
  targetProductId?: string;   // if internal_help
  durationWeeks: number;
  progress: number;           // 0..1
  rewardMoney: number;        // if outsourcing
  qualityBoost?: number;      // if internal_help
  riskPenalty?: number;
  startedAtWeek: number;
}

export type EmployeeStatus = 'office' | 'freelance';

export interface TeamMember {
  id: string;
  role: TeamRole;
  name: string;
  salary: number;
  level: number;            // 1..5, employee skill level
  experience: number;       // 0..100
  burnout: number;          // 0..100, high = bad
  morale: number;           // 0..100
  talent: number;           // 0..1, growth multiplier
  burnoutResistance: number; // 0..1, slows burnout gain
  trait: TraitId | null;
  zoneId: ZoneId | null;    // assigned office zone
  deskId: string | null;    // id of furniture item (desk) this employee is assigned to
  status: EmployeeStatus;
  freelanceTask: FreelanceTask | null;
  workProgress: number;               // 0..1, auto-cycling work task progress
  workCyclesCompleted: number;         // total completed work cycles
}

// Employee level thresholds: experience needed to reach each level
export const EMPLOYEE_LEVEL_THRESHOLDS = [0, 25, 50, 75, 95]; // level 1..5
export const EMPLOYEE_LEVEL_SALARY_MULT = [1.0, 1.2, 1.5, 1.9, 2.5]; // salary multiplier per level
export const EMPLOYEE_LEVEL_OUTPUT_MULT = [0.6, 1.0, 1.5, 2.1, 3.0]; // output multiplier per level — juniors produce less

// --- Employee Market ---
export type CandidateRarity = 'common' | 'uncommon' | 'rare' | 'legendary';

export interface MarketCandidate {
  id: string;
  role: TeamRole;
  name: string;
  salary: number;
  hireCost: number;
  experience: number;
  talent: number;
  burnoutResistance: number;
  trait: TraitId | null;
  rarity: CandidateRarity;
}

// --- Niche Subtypes ---
export type NicheSubtype = string; // e.g. 'payments' | 'lending' | 'crypto' for fintech

export interface NicheVariant {
  id: string;
  parentNicheId: string;
  name: string;
  description: string;
  demandMod: number;        // modifier on parent demand
  complexityMod: number;    // modifier on parent complexity
}

// --- Business Style ---
export type BusinessStyleId = 'bootstrapped' | 'vc_backed' | 'enterprise_first';

export interface BusinessStyle {
  id: BusinessStyleId;
  name: string;
  description: string;
  modifiers: Partial<BusinessStyleModifiers>;
}

export interface BusinessStyleModifiers {
  revenueMod: number;
  costMod: number;
  riskMod: number;
  growthMod: number;
  reputationMod: number;
  startingMoney: number;
}

// --- Company Product (multi-product system) ---
export type ProductLifecycle = 'prototype' | 'beta' | 'release' | 'growth' | 'maturity' | 'decline';

// Weeks required per lifecycle stage
export const LIFECYCLE_WEEKS: Record<ProductLifecycle, number> = {
  prototype: 4,
  beta: 3,
  release: 0, // stays until manually advanced or auto
  growth: 0,
  maturity: 0,
  decline: 0,
};

// Revenue multiplier per lifecycle stage
export const LIFECYCLE_REVENUE_MULT: Record<ProductLifecycle, number> = {
  prototype: 0,
  beta: 0.15,   // early-access revenue
  release: 0.7,
  growth: 1.0,
  maturity: 0.85,
  decline: 0.5,
};
export type CompanyProductType = 'saas' | 'app' | 'media' | 'platform';

export interface CompanyProduct {
  id: string;
  name: string;
  type: CompanyProductType;
  quality: number;          // 0..1
  audience: number;         // 0..1, market reach
  monetizationId: string;
  lifecycle: ProductLifecycle;
  lifecycleWeeks: number;   // weeks in current lifecycle stage
  revenue: number;          // calculated per turn
}

// --- Live Product (R1 core loop) ---
export type ProductFeatureClass = 'core' | 'growth' | 'monetization' | 'infrastructure';

export interface ProductFeatureTemplate {
  id: string;
  name: string;
  description: string;
  class: ProductFeatureClass;
  maxLevel: number;
  slotCost: number;
  unlockCost: number;
  levelUpCostBase: number;
  requiredFeatureIds?: string[];
  requiredReputation?: number;
  compatibleProductTypes?: CompanyProductType[];
  installRequirements?: Partial<ProductionResourceBundle>;
  levelUpRequirements?: Partial<ProductionResourceBundle>;
  effects: Partial<ProductFeatureEffects>;
}

export interface ProductFeatureEffects {
  trafficBoost: number;      // adds to weekly traffic growth potential
  conversionBoost: number;   // adds to signup conversion
  retentionBoost: number;    // reduces churn
  satisfactionBoost: number; // improves satisfaction drift
  monetizationBoost: number; // boosts paid conversion / ARPU proxy
  reliabilityBoost: number;  // lowers infrastructure pressure proxy
}

export interface ProductFeatureState {
  id: string;
  level: number;
  installed: boolean;
}

export interface LiveProductMetrics {
  traffic: number;
  signups: number;
  activeUsers: number;
  payingUsers: number;
  satisfaction: number; // 0..1
  conversion: number;   // 0..1
  churn: number;        // 0..1
}

export interface LiveProductWeekBreakdown {
  topPositiveFactors: string[];
  topNegativeFactors: string[];
  bottlenecks: string[];
  deltas: {
    traffic: number;
    signups: number;
    activeUsers: number;
    payingUsers: number;
    satisfaction: number;
    conversion: number;
    churn: number;
  };
}

export interface LiveProduct {
  id: string;
  productId: string;
  productType: CompanyProductType;
  featureSlots: number;
  features: ProductFeatureState[];
  metrics: LiveProductMetrics;
  lastWeek: LiveProductWeekBreakdown;
}

// --- Production Chain (R2 MVP) ---
export type ProductionResourceId = 'code' | 'design' | 'ops' | 'support';

export interface ProductionResourceBundle {
  code: number;
  design: number;
  ops: number;
  support: number;
}

export interface ProductionQueueItem {
  id: string;
  resource: ProductionResourceId;
  units: number;
  progress: number;
  createdWeek: number;
  priority: number; // lower is higher priority
}

export interface ProductionWeekReport {
  output: ProductionResourceBundle;
  delivered: ProductionResourceBundle;
  consumed: ProductionResourceBundle;
  idle: ProductionResourceBundle;
  completedQueueIds: string[];
  blockedQueueIds: string[];
}

export interface ProductionState {
  inventory: ProductionResourceBundle;
  queue: ProductionQueueItem[];
  nextQueueSeq: number;
  pendingConsumed: ProductionResourceBundle;
  lastWeek: ProductionWeekReport;
}

// --- Infrastructure + Support (R3 base) ---
export type HostingMode = 'cloud' | 'own';
export type InfrastructureServerType = 'web' | 'db' | 'cache';

export interface InfrastructureCapacity {
  web: number;
  db: number;
  cache: number;
}

export interface InfrastructureWeekReport {
  demand: InfrastructureCapacity;
  capacity: InfrastructureCapacity;
  utilization: InfrastructureCapacity; // 0..n where 1 == full load
  load: number;       // max utilization
  latencyMs: number;
  outageRisk: number; // 0..1
  outage: boolean;
  degradation: number; // 0..1 pressure applied to product loop
}

export interface InfrastructureState {
  hostingMode: HostingMode;
  cloudTier: 1 | 2 | 3;
  ownCapacity: InfrastructureCapacity;
  lastWeek: InfrastructureWeekReport;
}

export interface SupportState {
  openTickets: number;
  generatedLastWeek: number;
  resolvedLastWeek: number;
  avgWaitWeeks: number;
  slaTargetWeeks: number;
  backlogPressure: number; // 0..1
}

// --- Technology / Influence Tree ---
export type TechBranch = 'tech_core' | 'marketing_influence' | 'operations_process';

export interface TechTreeNode {
  id: string;
  branch: TechBranch;
  name: string;
  description: string;
  cost: number;
  weeksToResearch: number;
  requires: string[];       // prerequisite node IDs
  effects: Partial<TechTreeEffects>;
  unlocked: boolean;
  researching: boolean;
  researchProgress: number; // 0..100
  completed: boolean;
  requiredReputation?: number;
}

export interface TechTreeEffects {
  qualityMod: number;
  growthMod: number;
  riskMod: number;
  reputationMod: number;
  userGrowthMod: number;
  viralityMod: number;
  talentAccessMod: number;
}

// --- Office Furniture ---
export type FurnitureType = 'desk' | 'meeting_room' | 'server_room' | 'lounge' | 'stage';

export interface FurnitureItem {
  id: string;
  type: FurnitureType;
  name: string;
  description: string;
  cost: number;
  gridSize: [number, number]; // width x depth in grid cells
  position: [number, number] | null; // grid position, null = not placed
  assignedEmployeeId: string | null;  // employee sitting at this furniture
  effects: Partial<FurnitureEffects>;
}

export interface FurnitureEffects {
  teamSlotsMod: number;     // +employee capacity
  moraleMod: number;
  qualityMod: number;
  burnoutMod: number;       // negative = reduces burnout
  reputationMod: number;
}

// --- Niche ---
export interface Niche {
  id: string;
  name: string;
  description: string;
  baseDemand: number;       // 0..1
  baseComplexity: number;   // 0..1
  trendDecayRate: number;   // how fast demand decays per turn
  unlocked: boolean;
}

// --- Product ---
export interface Product {
  id: string;
  name: string;
  description: string;
  quality: number;          // 0..1
  nicheFit: Record<string, number>; // nicheId -> fit coefficient 0..2
  monetizationEfficiency: number; // 0..1
}

// --- Technology ---
export interface Technology {
  id: string;
  name: string;
  description: string;
  cost: number;
  complexityAdd: number;    // adds to tech complexity
  qualityBonus: number;     // adds to product quality
  synergyWith: string[];    // other tech IDs that boost synergy
}

// --- Market ---
export interface Market {
  id: string;
  name: string;
  description: string;
  accessModifier: number;   // 0..2
  demandMultiplier: number;
  isoRequired: string[];    // ISO IDs required for access
}

// --- Monetization Strategy ---
export interface MonetizationStrategy {
  id: string;
  name: string;
  description: string;
  efficiency: number;       // 0..1
  riskModifier: number;     // -0.5..0.5
}

// --- ISO Standard ---
export type ISOStage = 'none' | 'audit' | 'implementation' | 'internal_check' | 'certification' | 'maintenance';

export interface ISOStandard {
  id: string;
  name: string;
  description: string;
  currentStage: ISOStage;
  stageProgress: number;    // 0..100
  maintenanceCost: number;
  stabilizationBonus: number;
  reputationBonus: number;
  burnoutReduction: number;
  failRisk: number;         // 0..1 per turn in maintenance
  certified: boolean;
  turnsInMaintenance: number;
}

// --- Business ---
export interface BusinessMetrics {
  revenue: number;
  costs: number;
  profit: number;
  risk: number;             // 0..1
  quality: number;          // 0..1
  demand: number;           // 0..1
  growthRate: number;
  teamEfficiency: number;   // 0..1
}

export type LogoId = 'rocket' | 'zap' | 'shield' | 'diamond' | 'flame' | 'globe' | 'star' | 'crown' | 'target' | 'hexagon' | 'atom' | 'leaf';

// --- Office Level ---
export type WallMaterial = 'concrete' | 'glass';

export interface OfficeConfig {
  level: number;                // 1–4
  wallMaterials: {
    back: WallMaterial;
    left: WallMaterial;
    right: WallMaterial;
  };
}

// Level 1: 6 slots (2 dev, 1 qa, 1 manager, 1 security, 1 marketing)
// Each level: slots × 2, cost grows exponentially
export const OFFICE_LEVELS: { level: number; maxEmployees: number; upgradeCost: number; floorWidth: number; floorDepth: number }[] = [
  { level: 1, maxEmployees: 6,   upgradeCost: 0,       floorWidth: 8.5,  floorDepth: 9.5 },
  { level: 2, maxEmployees: 12,  upgradeCost: 25000,   floorWidth: 11,   floorDepth: 11 },
  { level: 3, maxEmployees: 20,  upgradeCost: 60000,   floorWidth: 13.5, floorDepth: 12.5 },
  { level: 4, maxEmployees: 30,  upgradeCost: 120000,  floorWidth: 16,   floorDepth: 14 },
];

export interface Business {
  companyName: string;
  logoId: LogoId;
  office: OfficeConfig;
  nicheId: string | null;
  nicheVariantId: string | null;
  productId: string | null;
  monetizationId: string | null;
  styleId: BusinessStyleId | null;
  technologies: string[];
  marketId: string;
  team: TeamMember[];
  isoStandards: ISOStandard[];
  metrics: BusinessMetrics;
  companyProducts: CompanyProduct[];
  techTree: TechTreeNode[];
  furniture: FurnitureItem[];
  employeeMarket: MarketCandidate[];
  marketRefreshWeek: number; // week when market was last refreshed
  liveProduct: LiveProduct | null;
  production: ProductionState;
  infrastructure: InfrastructureState;
  support: SupportState;
}

// --- Events ---
export type EventType = 'market' | 'internal' | 'crisis' | 'positive' | 'iso';

export interface GameEvent {
  id: string;
  type: EventType;
  title: string;
  description: string;
  effects: Partial<EventEffects>;
  condition?: (state: GameState) => boolean;
  weight: number;           // probability weight
}

export interface EventEffects {
  moneyDelta: number;
  reputationDelta: number;
  demandDelta: number;
  riskDelta: number;
  qualityDelta: number;
  burnoutDelta: number;     // applied to all team
  isoProgressDelta: number;
}

// --- Combination Result ---
export interface CombinationResult {
  revenue: number;
  growth: number;
  risk: number;
  quality: number;
  demand: number;
}

// --- Game State ---
export type GamePhase = 'setup' | 'playing' | 'won' | 'lost';

export interface GameLog {
  week: number;
  message: string;
  type: 'info' | 'warning' | 'success' | 'danger' | 'event';
}

export interface GameState {
  saveVersion: number;
  player: Player;
  business: Business;
  phase: GamePhase;
  logs: GameLog[];
  activeEvents: GameEvent[];
  availableNiches: Niche[];
  availableProducts: Product[];
  availableTechnologies: Technology[];
  availableMarkets: Market[];
  availableMonetizations: MonetizationStrategy[];
  availableNicheVariants: NicheVariant[];
  availableBusinessStyles: BusinessStyle[];
  weekHistory: BusinessMetrics[];
}
