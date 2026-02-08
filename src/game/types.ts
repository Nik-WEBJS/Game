// ============================================================
// Business Tycoon — Core Type Definitions
// ============================================================

// --- Player ---
export interface Player {
  money: number;
  reputation: number;
  experience: number;
  unlockedNiches: string[];
  unlockedProducts: string[];
  unlockedTechnologies: string[];
  currentWeek: number;
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

export interface TeamMember {
  id: string;
  role: TeamRole;
  name: string;
  salary: number;
  experience: number;       // 0..100
  burnout: number;          // 0..100, high = bad
  morale: number;           // 0..100
  talent: number;           // 0..1, growth multiplier
  burnoutResistance: number; // 0..1, slows burnout gain
  trait: TraitId | null;
  zoneId: ZoneId | null;    // assigned office zone
}

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
export type ProductLifecycle = 'mvp' | 'growth' | 'maturity' | 'decline';
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

// --- Technology / Influence Tree ---
export type TechBranch = 'tech_core' | 'marketing_influence';

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

export interface Business {
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
