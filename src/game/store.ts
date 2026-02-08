import { create } from 'zustand';
import { GameState, GamePhase, TeamRole, BusinessMetrics, BusinessStyleId, ZoneId, FurnitureItem } from './types';
import { NICHES, PRODUCTS, TECHNOLOGIES, MARKETS, MONETIZATIONS, createISO9001 } from './data';
import { NICHE_VARIANTS, BUSINESS_STYLES, createTechTree, generateMarketPool, MARKET_REFRESH_INTERVAL, FURNITURE_CATALOG } from './data-advanced';
import { applyEconomy, calculateEconomy } from './engines/economy';
import { tickISO, startISO, advanceISO, canStartISO, canAdvanceISO } from './engines/iso';
import { rollEvents, applyEvents } from './engines/events';
import { tickTeam, hireMember, fireMember, canHire, getHireCost, hireFromMarket, assignZone } from './engines/team';
import { checkWinLose, gainExperience } from './engines/progression';

const INITIAL_MONEY = 50000;

function createInitialState(): GameState {
  return {
    player: {
      money: INITIAL_MONEY,
      reputation: 50,
      experience: 0,
      unlockedNiches: ['fintech', 'healthtech', 'edtech'],
      unlockedProducts: ['saas_platform', 'mobile_app', 'marketplace'],
      unlockedTechnologies: ['cloud_infra', 'microservices', 'ai_ml', 'blockchain', 'cybersecurity'],
      currentWeek: 0,
    },
    business: {
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
      employeeMarket: generateMarketPool(5),
      marketRefreshWeek: 0,
    },
    phase: 'setup',
    logs: [
      { week: 0, message: 'Welcome to Business Tycoon! Choose your niche, product, and strategy to begin.', type: 'info' },
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

// Helper: extract GameState from store (avoids repeating all fields)
function toGameState(s: GameStore | GameState): GameState {
  return {
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
  setNiche: (nicheId: string) => void;
  setNicheVariant: (variantId: string | null) => void;
  setProduct: (productId: string) => void;
  setMonetization: (monetizationId: string) => void;
  setBusinessStyle: (styleId: BusinessStyleId) => void;
  adoptTechnology: (techId: string) => void;
  removeTechnology: (techId: string) => void;
  startGame: () => void;
  // Turn
  nextTurn: () => void;
  // Team
  hireTeamMember: (role: TeamRole) => void;
  fireTeamMember: (memberId: string) => void;
  hireFromMarket: (candidateId: string) => void;
  assignEmployeeZone: (memberId: string, zoneId: ZoneId | null) => void;
  // ISO
  startISOProcess: (isoId: string) => void;
  advanceISOStage: (isoId: string) => void;
  // Tech tree
  startResearch: (nodeId: string) => void;
  // Furniture
  buyFurniture: (type: string) => void;
  placeFurniture: (furnitureId: string, position: [number, number]) => void;
  unplaceFurniture: (furnitureId: string) => void;
  // Misc
  resetGame: () => void;
  canStartISO: (isoId: string) => boolean;
  canAdvanceISO: (isoId: string) => boolean;
  canHireMember: (role: TeamRole) => boolean;
  getHireCost: (role: TeamRole) => number;
  previewMetrics: () => BusinessMetrics;
}

export const useGameStore = create<GameStore>((set, get) => ({
  ...createInitialState(),

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
      logs: [...s.logs, { week: s.player.currentWeek, message: `Adopted ${tech.name} for $${tech.cost.toLocaleString()}.`, type: 'info' as const }],
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
    const gs = toGameState({ ...state, phase: 'playing', activeEvents: [], weekHistory: [] });
    const withEconomy = applyEconomy(gs);
    set({
      ...withEconomy,
      phase: 'playing',
      player: { ...withEconomy.player, currentWeek: 1 },
      logs: [...withEconomy.logs, { week: 1, message: '🚀 Your business is launched! Good luck!', type: 'success' }],
    });
  },

  nextTurn: () => {
    const state = get();
    if (state.phase !== 'playing') return;
    let gs = toGameState(state);

    // 1. Advance week
    gs = { ...gs, player: { ...gs.player, currentWeek: gs.player.currentWeek + 1 } };

    // 2. Tick team
    gs = tickTeam(gs);

    // 3. Tick ISO
    gs = tickISO(gs);

    // 4. Calculate economy
    gs = applyEconomy(gs);

    // 5. Events
    const events = rollEvents(gs);
    gs = events.length > 0 ? applyEvents(gs, events) : { ...gs, activeEvents: [] };

    // 6. Experience & reputation
    gs = gainExperience(gs);

    // 7. Decay niche demand
    const niche = NICHES.find(n => n.id === gs.business.nicheId);
    if (niche) niche.baseDemand = Math.max(0.2, niche.baseDemand - niche.trendDecayRate);

    // 8. Tick tech tree research
    gs = tickTechTree(gs);

    // 9. Refresh employee market
    gs = tickEmployeeMarket(gs);

    // 10. Record history
    gs = { ...gs, weekHistory: [...gs.weekHistory, { ...gs.business.metrics }] };

    // 11. Check win/lose
    gs = checkWinLose(gs);

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
      logs: [...s.logs, { week: s.player.currentWeek, message: `Started researching ${node.name}.`, type: 'info' as const }],
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
    };

    set(s => ({
      player: { ...s.player, money: s.player.money - catalog.cost },
      business: { ...s.business, furniture: [...s.business.furniture, item] },
      logs: [...s.logs, { week: s.player.currentWeek, message: `Purchased ${catalog.name} for $${catalog.cost.toLocaleString()}.`, type: 'info' as const }],
    }));
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
    set(s => ({
      business: {
        ...s.business,
        furniture: s.business.furniture.map(f =>
          f.id === furnitureId ? { ...f, position: null } : f
        ),
      },
    }));
  },

  resetGame: () => set(createInitialState()),

  canStartISO: (isoId) => canStartISO(toGameState(get()), isoId),
  canAdvanceISO: (isoId) => canAdvanceISO(toGameState(get()), isoId),
  canHireMember: (role) => canHire(toGameState(get()), role),
  getHireCost: (role) => getHireCost(role),
  previewMetrics: () => calculateEconomy(toGameState(get())),
}));

// --- Tech tree tick (called each turn) ---
function tickTechTree(state: GameState): GameState {
  let changed = false;
  const newTree = state.business.techTree.map(node => {
    if (!node.researching) return node;
    const progressPerWeek = 100 / node.weeksToResearch;
    const newProgress = Math.min(100, node.researchProgress + progressPerWeek);
    if (newProgress >= 100) {
      changed = true;
      return { ...node, researching: false, researchProgress: 100, completed: true };
    }
    return { ...node, researchProgress: newProgress };
  });

  // Unlock nodes whose prerequisites are now completed
  const finalTree = newTree.map(node => {
    if (node.unlocked || node.completed) return node;
    const allReqsMet = node.requires.every(reqId => newTree.find(n => n.id === reqId)?.completed);
    if (allReqsMet) return { ...node, unlocked: true };
    return node;
  });

  const newLogs = [...state.logs];
  if (changed) {
    const completed = finalTree.filter(n => n.completed && !state.business.techTree.find(o => o.id === n.id)?.completed);
    for (const c of completed) {
      newLogs.push({ week: state.player.currentWeek, message: `Research complete: ${c.name}!`, type: 'success' });
    }
  }

  return { ...state, business: { ...state.business, techTree: finalTree }, logs: newLogs };
}

// --- Employee market refresh ---
function tickEmployeeMarket(state: GameState): GameState {
  const weeksSinceRefresh = state.player.currentWeek - state.business.marketRefreshWeek;
  if (weeksSinceRefresh >= MARKET_REFRESH_INTERVAL) {
    return {
      ...state,
      business: {
        ...state.business,
        employeeMarket: generateMarketPool(5),
        marketRefreshWeek: state.player.currentWeek,
      },
      logs: [...state.logs, { week: state.player.currentWeek, message: 'Employee market refreshed with new candidates.', type: 'info' }],
    };
  }
  return state;
}
