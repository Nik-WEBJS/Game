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

// --- Team ---
export type TeamRole = 'developer' | 'manager' | 'qa' | 'security' | 'marketing';

export interface TeamMember {
  id: string;
  role: TeamRole;
  name: string;
  salary: number;
  experience: number;       // 0..100
  burnout: number;          // 0..100, high = bad
  morale: number;           // 0..100
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
  productId: string | null;
  monetizationId: string | null;
  technologies: string[];
  marketId: string;
  team: TeamMember[];
  isoStandards: ISOStandard[];
  metrics: BusinessMetrics;
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
  weekHistory: BusinessMetrics[];
}
