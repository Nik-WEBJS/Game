import { create } from 'zustand';
import { persist } from 'zustand/middleware';
import { GameState, GameSpeed, TeamRole, BusinessMetrics, BusinessStyleId, ZoneId, FurnitureItem, LogoId, WallMaterial, OFFICE_LEVELS, EMPLOYEE_LEVEL_OUTPUT_MULT, FreelanceTaskType, ProductionResourceBundle, ProductionResourceId, HostingMode, InfrastructureServerType, MnaActionType } from './types';
import { BALANCE } from './config/balance';
import { NICHES, PRODUCTS, TECHNOLOGIES, MARKETS, MONETIZATIONS, EVENTS_POOL, createISO9001 } from './data';
import { NICHE_VARIANTS, BUSINESS_STYLES, createTechTree, generateMarketPool, FURNITURE_CATALOG } from './data-advanced';
import { createInitialLiveProduct } from './data-product';
import { createInitialProductionState } from './data-production';
import { createInitialInfrastructureState, createInitialSupportState } from './data-infrastructure';
import { createInitialCampaignState, createInitialCompetitionState } from './data-competition';
import { calculateEconomy, calculateEconomyWithBreakdown, EconomyBreakdown } from './engines/economy';
import { simulateWeek, runDeterministicSimulationTest, DeterministicSimulationResult } from './engines/simulation';
import { startISO, advanceISO, canStartISO, canAdvanceISO, isManagerBusyWithISO } from './engines/iso';
import { applyEvents } from './engines/events';
import { hireMember, fireMember, canHire, getHireCost, hireFromMarket, assignZone, assignDesk } from './engines/team';
import { createInitialProduct } from './engines/product';
import { sendToFreelance as sendFreelance, canSendToFreelance } from './engines/freelance';
import { installFeature, upgradeFeature, canInstallFeature, canUpgradeFeature, upgradeFeatureSlots, getFeatureSlotUpgradeCost } from './engines/live-product';
import { cancelProductionQueueItem, enqueueProduction, estimateWeeklyProductionOutput, moveProductionQueueItem } from './engines/production';
import {
  canUpgradeOwnCapacity as infraCanUpgradeOwnCapacity,
  getCloudTierUpgradeCost as infraGetCloudTierUpgradeCost,
  getOwnCapacityUpgradeCost as infraGetOwnCapacityUpgradeCost,
  runSupportBurst as infraRunSupportBurst,
  setHostingMode as infraSetHostingMode,
  upgradeCloudTier as infraUpgradeCloudTier,
  upgradeOwnCapacity as infraUpgradeOwnCapacity,
} from './engines/infrastructure-support';
import {
  canExecuteMnaAction as compCanExecuteMnaAction,
  executeMnaAction as compExecuteMnaAction,
  getMnaActionCost as compGetMnaActionCost,
} from './engines/competition';
import { startPlacement } from '../office/furnitureState';
import { getT } from '../i18n';
import { ttNodeName, furnitureName as furnName, techName as tName } from '../i18n/game-text';

const INITIAL_MONEY = BALANCE.start.money;
const SAVE_VERSION = BALANCE.saveVersion;
const SAVE_KEY = 'business-tycoon-save';
export type DebugSelfTestResult = DeterministicSimulationResult;

function createInitialState(): GameState {
  return {
    saveVersion: SAVE_VERSION,
    player: {
      money: INITIAL_MONEY,
      reputation: BALANCE.start.reputation,
      experience: 0,
      unlockedNiches: ['fintech', 'healthtech', 'edtech', 'gamedev', 'ecommerce', 'cybersec'],
      unlockedProducts: ['saas_platform', 'mobile_app', 'marketplace', 'api_service', 'desktop_app'],
      unlockedTechnologies: ['cloud_infra', 'microservices', 'ai_ml', 'blockchain', 'cybersecurity'],
      currentWeek: 0,
      gameSpeed: 0 as GameSpeed,
      weekProgress: 0,
      totalTimePlayed: 0,
    },
    business: {
      companyName: 'My Company',
      logoId: 'rocket' as LogoId,
      office: {
        level: 1,
        wallMaterials: { back: 'concrete', left: 'concrete', right: 'concrete' },
      },
      nicheId: null,
      nicheVariantId: null,
      productId: null,
      monetizationId: null,
      styleId: null,
      technologies: [],
      marketId: 'domestic',
      team: [],
      isoStandards: [createISO9001()],
      metrics: {
        revenue: 0,
        costs: 0,
        profit: 0,
        risk: 0.1,
        quality: 0,
        demand: 0,
        growthRate: 0,
        teamEfficiency: 0.5,
      },
      companyProducts: [],
      techTree: createTechTree(),
      furniture: [],
      employeeMarket: generateMarketPool(5, 10),
      marketRefreshWeek: 0,
      liveProduct: null,
      production: createInitialProductionState(),
      infrastructure: createInitialInfrastructureState(),
      support: createInitialSupportState(),
      competition: createInitialCompetitionState(null),
      campaign: createInitialCampaignState(),
    },
    phase: 'setup',
    logs: [
      { week: 0, message: getT().welcomeMessage, type: 'info' },
    ],
    activeEvents: [],
    availableNiches: NICHES,
    availableProducts: PRODUCTS,
    availableTechnologies: TECHNOLOGIES,
    availableMarkets: MARKETS,
    availableMonetizations: MONETIZATIONS,
    availableNicheVariants: NICHE_VARIANTS,
    availableBusinessStyles: BUSINESS_STYLES,
    weekHistory: [],
  };
}

function mergeWithInitialState(persisted: Partial<GameState> | undefined): GameState {
  const base = createInitialState();
  if (!persisted) return base;

  const business = (persisted.business ?? {}) as Partial<GameState['business']>;
  const office = (business.office ?? {}) as Partial<GameState['business']['office']>;

  return {
    ...base,
    ...persisted,
    player: { ...base.player, ...(persisted.player ?? {}) },
    business: {
      ...base.business,
      ...business,
      office: {
        ...base.business.office,
        ...office,
        wallMaterials: {
          ...base.business.office.wallMaterials,
          ...(office.wallMaterials ?? {}),
        },
      },
      metrics: { ...base.business.metrics, ...(business.metrics ?? {}) },
      technologies: business.technologies ?? base.business.technologies,
      team: business.team ?? base.business.team,
      isoStandards: business.isoStandards ?? base.business.isoStandards,
      companyProducts: business.companyProducts ?? base.business.companyProducts,
      techTree: business.techTree ?? base.business.techTree,
      furniture: business.furniture ?? base.business.furniture,
      employeeMarket: business.employeeMarket ?? base.business.employeeMarket,
      production: (() => {
        const source = business.production;
        const baseProduction = base.business.production;
        if (!source) return baseProduction;
        return {
          ...baseProduction,
          ...source,
          queue: source.queue ?? baseProduction.queue,
          nextQueueSeq: source.nextQueueSeq ?? baseProduction.nextQueueSeq,
          inventory: { ...baseProduction.inventory, ...(source.inventory ?? {}) },
          pendingConsumed: { ...baseProduction.pendingConsumed, ...(source.pendingConsumed ?? {}) },
          lastWeek: {
            ...baseProduction.lastWeek,
            ...(source.lastWeek ?? {}),
            output: { ...baseProduction.lastWeek.output, ...(source.lastWeek?.output ?? {}) },
            delivered: { ...baseProduction.lastWeek.delivered, ...(source.lastWeek?.delivered ?? {}) },
            consumed: { ...baseProduction.lastWeek.consumed, ...(source.lastWeek?.consumed ?? {}) },
            idle: { ...baseProduction.lastWeek.idle, ...(source.lastWeek?.idle ?? {}) },
          },
        };
      })(),
      infrastructure: (() => {
        const source = business.infrastructure;
        const baseInfra = base.business.infrastructure;
        if (!source) return baseInfra;
        return {
          ...baseInfra,
          ...source,
          ownCapacity: { ...baseInfra.ownCapacity, ...(source.ownCapacity ?? {}) },
          lastWeek: {
            ...baseInfra.lastWeek,
            ...(source.lastWeek ?? {}),
            demand: { ...baseInfra.lastWeek.demand, ...(source.lastWeek?.demand ?? {}) },
            capacity: { ...baseInfra.lastWeek.capacity, ...(source.lastWeek?.capacity ?? {}) },
            utilization: { ...baseInfra.lastWeek.utilization, ...(source.lastWeek?.utilization ?? {}) },
          },
        };
      })(),
      support: (() => {
        const source = business.support;
        const baseSupport = base.business.support;
        if (!source) return baseSupport;
        return { ...baseSupport, ...source };
      })(),
      competition: (() => {
        const source = business.competition;
        const fallback = (persisted.phase === 'playing' && business.nicheId)
          ? createInitialCompetitionState(business.nicheId)
          : base.business.competition;
        const baseCompetition = fallback;
        if (!source) return baseCompetition;
        return {
          ...baseCompetition,
          ...source,
          competitors: source.competitors ?? baseCompetition.competitors,
          pendingPressureEvents: source.pendingPressureEvents ?? baseCompetition.pendingPressureEvents,
          lastWeek: { ...baseCompetition.lastWeek, ...(source.lastWeek ?? {}) },
        };
      })(),
      campaign: (() => {
        const source = business.campaign;
        const baseCampaign = base.business.campaign;
        if (!source) return baseCampaign;
        return {
          ...baseCampaign,
          ...source,
          completedIds: source.completedIds ?? baseCampaign.completedIds,
          discoveredIds: source.discoveredIds ?? baseCampaign.discoveredIds,
          flags: { ...baseCampaign.flags, ...(source.flags ?? {}) },
        };
      })(),
      liveProduct: (() => {
        const fallback = (persisted.phase === 'playing' && business.productId)
          ? createInitialLiveProduct(business.productId)
          : base.business.liveProduct;
        const source = business.liveProduct ?? fallback;
        if (!source) return null;
        const baseLive = fallback ?? source;
        return {
          ...baseLive,
          ...source,
          metrics: { ...baseLive.metrics, ...source.metrics },
          lastWeek: {
            ...baseLive.lastWeek,
            ...source.lastWeek,
            deltas: { ...baseLive.lastWeek.deltas, ...(source.lastWeek?.deltas ?? {}) },
          },
        };
      })(),
    },
    logs: persisted.logs ?? base.logs,
    activeEvents: persisted.activeEvents ?? base.activeEvents,
    weekHistory: persisted.weekHistory ?? base.weekHistory,
    // Static catalogs are always taken from current code version
    availableNiches: base.availableNiches,
    availableProducts: base.availableProducts,
    availableTechnologies: base.availableTechnologies,
    availableMarkets: base.availableMarkets,
    availableMonetizations: base.availableMonetizations,
    availableNicheVariants: base.availableNicheVariants,
    availableBusinessStyles: base.availableBusinessStyles,
  };
}

// Helper: extract GameState from store (avoids repeating all fields)
function toGameState(s: GameStore | GameState): GameState {
  return {
    saveVersion: s.saveVersion,
    player: s.player,
    business: s.business,
    phase: s.phase,
    logs: s.logs,
    activeEvents: s.activeEvents,
    availableNiches: s.availableNiches,
    availableProducts: s.availableProducts,
    availableTechnologies: s.availableTechnologies,
    availableMarkets: s.availableMarkets,
    availableMonetizations: s.availableMonetizations,
    availableNicheVariants: s.availableNicheVariants,
    availableBusinessStyles: s.availableBusinessStyles,
    weekHistory: s.weekHistory,
  };
}

interface GameStore extends GameState {
  // Setup actions
  setCompanyName: (name: string) => void;
  setCompanyLogo: (logoId: LogoId) => void;
  setNiche: (nicheId: string) => void;
  setNicheVariant: (variantId: string | null) => void;
  setProduct: (productId: string) => void;
  setMonetization: (monetizationId: string) => void;
  setBusinessStyle: (styleId: BusinessStyleId) => void;
  adoptTechnology: (techId: string) => void;
  removeTechnology: (techId: string) => void;
  startGame: () => void;
  installProductFeature: (featureId: string) => void;
  upgradeProductFeature: (featureId: string) => void;
  buyProductFeatureSlot: () => void;
  canInstallProductFeature: (featureId: string) => { ok: boolean; reason?: string };
  canUpgradeProductFeature: (featureId: string) => { ok: boolean; reason?: string; cost?: number };
  getProductFeatureSlotCost: () => number;
  enqueueProductionQueue: (resource: ProductionResourceId, units: number) => void;
  cancelProductionQueue: (queueId: string) => void;
  moveProductionQueue: (queueId: string, direction: -1 | 1) => void;
  estimateProductionOutput: () => ProductionResourceBundle;
  setHostingMode: (mode: HostingMode) => void;
  upgradeCloudTier: () => void;
  getCloudTierUpgradeCost: () => number | null;
  upgradeOwnServerCapacity: (serverType: InfrastructureServerType) => void;
  canUpgradeOwnServerCapacity: (serverType: InfrastructureServerType) => boolean;
  getOwnServerUpgradeCost: (serverType: InfrastructureServerType) => { money: number; ops: number; step: number };
  runSupportBurst: (requestedTickets?: number) => void;
  executeMnaAction: (action: MnaActionType, competitorId: string) => void;
  canExecuteMnaAction: (action: MnaActionType, competitorId: string) => { ok: boolean; reason?: string; cost?: number };
  getMnaActionCost: (action: MnaActionType, competitorId: string) => number | null;
  // Time
  setGameSpeed: (speed: GameSpeed) => void;
  gameTick: (deltaSec: number) => void;
  // Team
  hireTeamMember: (role: TeamRole) => void;
  fireTeamMember: (memberId: string) => void;
  hireFromMarket: (candidateId: string) => void;
  assignEmployeeZone: (memberId: string, zoneId: ZoneId | null) => void;
  assignEmployeeDesk: (memberId: string, deskId: string | null) => void;
  // ISO
  startISOProcess: (isoId: string) => void;
  advanceISOStage: (isoId: string) => void;
  // Tech tree
  startResearch: (nodeId: string) => void;
  // Office
  upgradeOffice: () => void;
  setWallMaterial: (wall: 'back' | 'left' | 'right', material: WallMaterial) => void;
  // Furniture
  buyFurniture: (type: string) => void;
  placeFurniture: (furnitureId: string, position: [number, number]) => void;
  unplaceFurniture: (furnitureId: string) => void;
  // Freelance
  sendToFreelance: (memberId: string, taskType: FreelanceTaskType, targetProductId?: string) => void;
  recallFromFreelance: (memberId: string) => void;
  canSendFreelance: (memberId: string) => { ok: boolean; reason?: string };
  // Misc
  resetGame: () => void;
  canStartISO: (isoId: string) => { ok: boolean; reason?: string };
  canAdvanceISO: (isoId: string) => boolean;
  canHireMember: (role: TeamRole) => boolean;
  getHireCost: (role: TeamRole) => number;
  previewMetrics: () => BusinessMetrics;
  previewEconomyBreakdown: () => EconomyBreakdown;
  exportSave: () => string | null;
  importSave: (raw: string) => { ok: boolean; reason?: string };
  debugRunSelfTest: (weeks?: number, seed?: number) => DebugSelfTestResult;
  debugAdvanceWeeks: (weeks: number) => void;
  debugTriggerEvent: (eventId: string) => void;
  debugClearSave: () => void;
}

export const useGameStore = create<GameStore>()(persist((set, get) => ({
  ...createInitialState(),

  setCompanyName: (name) => {
    set(s => ({ business: { ...s.business, companyName: name } }));
  },

  setCompanyLogo: (logoId) => {
    set(s => ({ business: { ...s.business, logoId } }));
  },

  setNiche: (nicheId) => {
    set(s => ({ business: { ...s.business, nicheId, nicheVariantId: null } }));
  },

  setNicheVariant: (variantId) => {
    set(s => ({ business: { ...s.business, nicheVariantId: variantId } }));
  },

  setProduct: (productId) => {
    set(s => ({ business: { ...s.business, productId } }));
  },

  setMonetization: (monetizationId) => {
    set(s => ({ business: { ...s.business, monetizationId } }));
  },

  setBusinessStyle: (styleId) => {
    const style = BUSINESS_STYLES.find(s => s.id === styleId);
    if (!style) return;
    const startMoney = style.modifiers.startingMoney ?? INITIAL_MONEY;
    set(s => ({
      player: { ...s.player, money: startMoney },
      business: { ...s.business, styleId },
    }));
  },

  adoptTechnology: (techId) => {
    const state = get();
    const tech = TECHNOLOGIES.find(t => t.id === techId);
    if (!tech || state.business.technologies.includes(techId)) return;
    if (state.player.money < tech.cost) return;
    set(s => ({
      player: { ...s.player, money: s.player.money - tech.cost },
      business: { ...s.business, technologies: [...s.business.technologies, techId] },
      logs: [...s.logs, { week: s.player.currentWeek, message: getT().adoptedTechMessage(tName(tech.id, getT(), tech.name), `$${tech.cost.toLocaleString()}`), type: 'info' as const }],
    }));
  },

  removeTechnology: (techId) => {
    set(s => ({
      business: { ...s.business, technologies: s.business.technologies.filter(t => t !== techId) },
    }));
  },

  startGame: () => {
    const state = get();
    if (!state.business.nicheId || !state.business.productId || !state.business.monetizationId) return;
    // Create initial company product in prototype stage
    const productDef = PRODUCTS.find(p => p.id === state.business.productId);
    const initialProduct = createInitialProduct(
      state.business.productId!,
      productDef?.name ?? 'My Product',
      state.business.monetizationId!,
    );
    const liveProduct = createInitialLiveProduct(state.business.productId!);
    const competition = createInitialCompetitionState(state.business.nicheId);
    const campaign = createInitialCampaignState();
    const gs = toGameState({
      ...state,
      phase: 'playing',
      activeEvents: [],
      weekHistory: [],
      business: { ...state.business, companyProducts: [initialProduct], liveProduct, competition, campaign },
    });
    const econ = calculateEconomyWithBreakdown(gs);
    const withEconomy: GameState = {
      ...gs,
      player: { ...gs.player, money: Math.round(gs.player.money + econ.metrics.profit) },
      business: { ...gs.business, metrics: econ.metrics },
    };
    set({
      ...withEconomy,
      phase: 'playing',
      player: { ...withEconomy.player, currentWeek: 1, gameSpeed: 1 as GameSpeed, weekProgress: 0, totalTimePlayed: 0 },
      logs: [...withEconomy.logs, { week: 1, message: getT().launchedPrototypeMessage, type: 'success' }],
    });
  },

  installProductFeature: (featureId) => {
    set(installFeature(toGameState(get()), featureId));
  },
  upgradeProductFeature: (featureId) => {
    set(upgradeFeature(toGameState(get()), featureId));
  },
  buyProductFeatureSlot: () => {
    set(upgradeFeatureSlots(toGameState(get())));
  },
  canInstallProductFeature: (featureId) => canInstallFeature(toGameState(get()), featureId),
  canUpgradeProductFeature: (featureId) => canUpgradeFeature(toGameState(get()), featureId),
  getProductFeatureSlotCost: () => getFeatureSlotUpgradeCost(toGameState(get())),
  enqueueProductionQueue: (resource, units) => {
    set(enqueueProduction(toGameState(get()), resource, units));
  },
  cancelProductionQueue: (queueId) => {
    set(cancelProductionQueueItem(toGameState(get()), queueId));
  },
  moveProductionQueue: (queueId, direction) => {
    set(moveProductionQueueItem(toGameState(get()), queueId, direction));
  },
  estimateProductionOutput: () => estimateWeeklyProductionOutput(toGameState(get())),
  setHostingMode: (mode) => {
    set(infraSetHostingMode(toGameState(get()), mode));
  },
  upgradeCloudTier: () => {
    set(infraUpgradeCloudTier(toGameState(get())));
  },
  getCloudTierUpgradeCost: () => infraGetCloudTierUpgradeCost(toGameState(get())),
  upgradeOwnServerCapacity: (serverType) => {
    set(infraUpgradeOwnCapacity(toGameState(get()), serverType));
  },
  canUpgradeOwnServerCapacity: (serverType) => infraCanUpgradeOwnCapacity(toGameState(get()), serverType),
  getOwnServerUpgradeCost: (serverType) => infraGetOwnCapacityUpgradeCost(toGameState(get()), serverType),
  runSupportBurst: (requestedTickets) => {
    set(infraRunSupportBurst(toGameState(get()), requestedTickets));
  },
  executeMnaAction: (action, competitorId) => {
    set(compExecuteMnaAction(toGameState(get()), action, competitorId));
  },
  canExecuteMnaAction: (action, competitorId) => compCanExecuteMnaAction(toGameState(get()), action, competitorId),
  getMnaActionCost: (action, competitorId) => compGetMnaActionCost(toGameState(get()), action, competitorId),

  setGameSpeed: (speed) => {
    set(s => ({ player: { ...s.player, gameSpeed: speed } }));
  },

  // Called every animation frame with real delta seconds
  // SECONDS_PER_WEEK controls how fast a "week" passes in real time
  gameTick: (deltaSec) => {
    const state = get();
    if (state.phase !== 'playing' || state.player.gameSpeed === 0) return;

    const SECONDS_PER_WEEK = BALANCE.time.secondsPerWeekAt1x;
    const speedMul = state.player.gameSpeed; // 1, 2, or 3
    const weekDelta = (deltaSec * speedMul) / SECONDS_PER_WEEK;
    const newProgress = state.player.weekProgress + weekDelta;
    const newTotalTime = state.player.totalTimePlayed + deltaSec * speedMul;

    // Generate zone points from employees at desks (continuous)
    let gs = toGameState(state);
    gs = tickEmployeePointGeneration(gs, weekDelta);

    if (newProgress >= 1) {
      // A full week has passed — run all weekly systems
      gs = { ...gs, player: { ...gs.player, currentWeek: gs.player.currentWeek + 1, weekProgress: newProgress - 1, totalTimePlayed: newTotalTime } };
      gs = simulateWeek(gs);
    } else {
      gs = { ...gs, player: { ...gs.player, weekProgress: newProgress, totalTimePlayed: newTotalTime } };
    }

    set(gs);
  },

  hireTeamMember: (role) => {
    set(hireMember(toGameState(get()), role));
  },

  fireTeamMember: (memberId) => {
    set(fireMember(toGameState(get()), memberId));
  },

  hireFromMarket: (candidateId) => {
    set(hireFromMarket(toGameState(get()), candidateId));
  },

  assignEmployeeZone: (memberId, zoneId) => {
    set(assignZone(toGameState(get()), memberId, zoneId));
  },

  assignEmployeeDesk: (memberId, deskId) => {
    set(assignDesk(toGameState(get()), memberId, deskId));
  },

  startISOProcess: (isoId) => {
    set(startISO(toGameState(get()), isoId));
  },

  advanceISOStage: (isoId) => {
    set(advanceISO(toGameState(get()), isoId));
  },

  startResearch: (nodeId) => {
    const state = get();
    const node = state.business.techTree.find(n => n.id === nodeId);
    if (!node || node.completed || node.researching) return;
    if (!node.unlocked) return;
    if (state.player.money < node.cost) return;
    // Check if another research is already in progress
    if (state.business.techTree.some(n => n.researching)) return;
    if (node.requiredReputation && state.player.reputation < node.requiredReputation) return;

    set(s => ({
      player: { ...s.player, money: s.player.money - node.cost },
      business: {
        ...s.business,
        techTree: s.business.techTree.map(n =>
          n.id === nodeId ? { ...n, researching: true, researchProgress: 0 } : n
        ),
      },
      logs: [...s.logs, { week: s.player.currentWeek, message: getT().startedResearchMessage(ttNodeName(node.id, getT(), node.name)), type: 'info' as const }],
    }));
  },

  upgradeOffice: () => {
    const state = get();
    const currentLevel = state.business.office.level;
    const nextLevelDef = OFFICE_LEVELS.find(l => l.level === currentLevel + 1);
    if (!nextLevelDef) return; // already max level
    if (state.player.money < nextLevelDef.upgradeCost) return;
    set(s => ({
      player: { ...s.player, money: s.player.money - nextLevelDef.upgradeCost },
      business: {
        ...s.business,
        office: { ...s.business.office, level: nextLevelDef.level },
      },
      logs: [...s.logs, { week: s.player.currentWeek, message: getT().officeUpgradedMessage(nextLevelDef.level, nextLevelDef.maxEmployees), type: 'success' as const }],
    }));
  },

  setWallMaterial: (wall, material) => {
    set(s => ({
      business: {
        ...s.business,
        office: {
          ...s.business.office,
          wallMaterials: { ...s.business.office.wallMaterials, [wall]: material },
        },
      },
    }));
  },

  buyFurniture: (type) => {
    const catalog = FURNITURE_CATALOG.find(f => f.type === type);
    if (!catalog) return;
    const state = get();
    if (state.player.money < catalog.cost) return;

    const item: FurnitureItem = {
      ...catalog,
      id: `furn_${Date.now()}_${Math.random().toString(36).slice(2, 5)}`,
      position: null,
      assignedEmployeeId: null,
    };

    set(s => ({
      player: { ...s.player, money: s.player.money - catalog.cost },
      business: { ...s.business, furniture: [...s.business.furniture, item] },
      logs: [...s.logs, { week: s.player.currentWeek, message: getT().purchasedFurnitureMessage(furnName(catalog.type, getT(), catalog.name), `$${catalog.cost.toLocaleString()}`), type: 'info' as const }],
    }));
    // Auto-start placement mode for the newly purchased item
    startPlacement(item.id);
  },

  placeFurniture: (furnitureId, position) => {
    set(s => ({
      business: {
        ...s.business,
        furniture: s.business.furniture.map(f =>
          f.id === furnitureId ? { ...f, position } : f
        ),
      },
    }));
  },

  unplaceFurniture: (furnitureId) => {
    set(s => {
      const furn = s.business.furniture.find(f => f.id === furnitureId);
      const empId = furn?.assignedEmployeeId ?? null;
      return {
        business: {
          ...s.business,
          furniture: s.business.furniture.map(f =>
            f.id === furnitureId ? { ...f, position: null, assignedEmployeeId: null } : f
          ),
          team: empId
            ? s.business.team.map(m => m.id === empId ? { ...m, deskId: null } : m)
            : s.business.team,
        },
      };
    });
  },

  sendToFreelance: (memberId, taskType, targetProductId) => {
    set(sendFreelance(toGameState(get()), memberId, taskType, targetProductId));
  },

  recallFromFreelance: (memberId) => {
    const state = get();
    const member = state.business.team.find(m => m.id === memberId);
    if (!member || member.status !== 'freelance') return;
    const t = getT();
    set(s => ({
      business: {
        ...s.business,
        team: s.business.team.map(m =>
          m.id === memberId
            ? { ...m, status: 'office' as const, freelanceTask: null }
            : m
        ),
      },
      logs: [...s.logs, { week: s.player.currentWeek, message: t.freelanceRecalled(member.name), type: 'warning' as const }],
    }));
  },

  canSendFreelance: (memberId) => canSendToFreelance(toGameState(get()), memberId),

  resetGame: () => set(createInitialState()),

  canStartISO: (isoId) => canStartISO(toGameState(get()), isoId),
  canAdvanceISO: (isoId) => canAdvanceISO(toGameState(get()), isoId),
  canHireMember: (role) => canHire(toGameState(get()), role),
  getHireCost: (role) => getHireCost(role),
  previewMetrics: () => calculateEconomy(toGameState(get())),
  previewEconomyBreakdown: () => calculateEconomyWithBreakdown(toGameState(get())).breakdown,
  exportSave: () => {
    if (typeof window === 'undefined') return null;
    return localStorage.getItem(SAVE_KEY);
  },
  importSave: (raw) => {
    if (typeof window === 'undefined') return { ok: false, reason: 'no_window' };
    try {
      const parsed = JSON.parse(raw);
      const candidate = (parsed && typeof parsed === 'object' && 'state' in parsed)
        ? (parsed.state as Partial<GameState>)
        : (parsed as Partial<GameState>);
      const merged = mergeWithInitialState(candidate);
      const payload = JSON.stringify({ state: merged, version: SAVE_VERSION });
      localStorage.setItem(SAVE_KEY, payload);
      set(merged);
      return { ok: true };
    } catch {
      return { ok: false, reason: 'invalid_json' };
    }
  },
  debugRunSelfTest: (weeks = 52, seed = 1337) => {
    return runDeterministicSimulationTest(toGameState(get()), weeks, seed);
  },
  debugAdvanceWeeks: (weeks) => {
    const count = Math.max(1, Math.min(BALANCE.simulation.maxFastForwardWeeks, Math.floor(weeks || 1)));
    set(s => {
      let gs = toGameState(s);
      for (let i = 0; i < count; i++) {
        if (gs.phase !== 'playing') break;
        gs = {
          ...gs,
          player: {
            ...gs.player,
            currentWeek: gs.player.currentWeek + 1,
            weekProgress: 0,
          },
        };
        gs = simulateWeek(gs);
      }
      return gs;
    });
  },
  debugTriggerEvent: (eventId) => {
    const state = get();
    const event = EVENTS_POOL.find(e => e.id === eventId);
    if (!event) return;
    const gs = applyEvents(toGameState(state), [event]);
    set(gs);
  },
  debugClearSave: () => {
    if (typeof window !== 'undefined') {
      localStorage.removeItem(SAVE_KEY);
    }
    set(createInitialState());
  },
}), {
  name: SAVE_KEY,
  version: SAVE_VERSION,
  partialize: (state) => ({
    saveVersion: state.saveVersion,
    player: state.player,
    business: state.business,
    phase: state.phase,
    logs: state.logs.slice(-250),
    activeEvents: state.activeEvents,
    weekHistory: state.weekHistory,
    availableNiches: state.availableNiches,
    availableProducts: state.availableProducts,
    availableTechnologies: state.availableTechnologies,
    availableMarkets: state.availableMarkets,
    availableMonetizations: state.availableMonetizations,
    availableNicheVariants: state.availableNicheVariants,
    availableBusinessStyles: state.availableBusinessStyles,
  }),
  migrate: (persistedState) => {
    return mergeWithInitialState(persistedState as Partial<GameState>);
  },
}));

// --- Employee point generation (continuous, called every tick) ---
// Employees sitting at desks generate points based on their zone assignment
// Zone → metric mapping: development→quality, marketing→growthRate, security→risk(-), qa→quality
// Also advances work progress bar — when full, awards money and auto-restarts
function tickEmployeePointGeneration(state: GameState, weekFraction: number): GameState {
  const POINTS_PER_WEEK = BALANCE.employee.pointsPerWeek;
  const WORK_CYCLE_WEEKS = BALANCE.employee.workCycleWeeks;
  let qualityDelta = 0;
  let growthDelta = 0;
  let riskDelta = 0;
  let moneyEarned = 0;
  let teamUpdated = false;

  const managersOnISO = isManagerBusyWithISO(state);

  const newTeam = state.business.team.map(member => {
    // Skip freelancers — they don't generate zone points
    if (member.status === 'freelance') return member;
    // Managers assigned to ISO don't do normal work
    if (member.role === 'manager' && managersOnISO) return member;
    // Only generate if assigned to a placed desk
    if (!member.deskId) return member;
    const desk = state.business.furniture.find(f => f.id === member.deskId && f.position);
    if (!desk) return member;

    const levelMult = EMPLOYEE_LEVEL_OUTPUT_MULT[(member.level || 1) - 1] ?? 1;
    const efficiency = (member.experience / 100) * (1 - member.burnout / 200) * (member.morale / 100);
    const output = POINTS_PER_WEEK * weekFraction * efficiency * (1 + member.talent) * levelMult;

    switch (member.zoneId) {
      case 'development':
        qualityDelta += output;
        break;
      case 'marketing':
        growthDelta += output;
        break;
      case 'security':
        riskDelta -= output * 0.5; // reduces risk
        break;
      case 'qa':
        qualityDelta += output * 0.7;
        riskDelta -= output * 0.3;
        break;
      default:
        // No zone assigned — small general contribution
        qualityDelta += output * 0.3;
        break;
    }

    // Advance work progress bar
    const progressSpeed = (1 / WORK_CYCLE_WEEKS) * weekFraction * Math.max(0.3, efficiency) * levelMult;
    let newProgress = (member.workProgress || 0) + progressSpeed;
    let cycles = member.workCyclesCompleted || 0;

    if (newProgress >= 1) {
      // Work cycle complete — reward scales steeply with level
      // Level 1 (junior): salary × 0.15 × 0.6 = tiny income
      // Level 5 (senior): salary × 0.15 × 3.0 × 1.3 = significant income
      const levelRewardMult = levelMult * (1 + member.talent * 0.3);
      const baseReward = member.salary * 0.15 * levelRewardMult;
      moneyEarned += Math.round(baseReward);
      newProgress -= 1;
      cycles += 1;
      teamUpdated = true;
    }

    if (newProgress !== (member.workProgress || 0) || cycles !== (member.workCyclesCompleted || 0)) {
      teamUpdated = true;
      return { ...member, workProgress: newProgress, workCyclesCompleted: cycles };
    }
    return member;
  });

  const noChange = !teamUpdated && qualityDelta === 0 && growthDelta === 0 && riskDelta === 0;
  if (noChange) return state;

  const m = state.business.metrics;
  return {
    ...state,
    player: moneyEarned > 0 ? { ...state.player, money: state.player.money + moneyEarned } : state.player,
    business: {
      ...state.business,
      team: teamUpdated ? newTeam : state.business.team,
      metrics: {
        ...m,
        quality: Math.min(1, Math.max(0, m.quality + qualityDelta)),
        growthRate: Math.min(1, Math.max(0, m.growthRate + growthDelta)),
        risk: Math.min(1, Math.max(0, m.risk + riskDelta)),
      },
    },
  };
}

