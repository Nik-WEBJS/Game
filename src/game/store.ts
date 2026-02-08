import { create } from 'zustand';
import { GameState, GamePhase, GameSpeed, TeamRole, BusinessMetrics, BusinessStyleId, ZoneId, FurnitureItem, LogoId, WallMaterial, OFFICE_LEVELS, EMPLOYEE_LEVEL_OUTPUT_MULT } from './types';
import { NICHES, PRODUCTS, TECHNOLOGIES, MARKETS, MONETIZATIONS, createISO9001 } from './data';
import { NICHE_VARIANTS, BUSINESS_STYLES, createTechTree, generateMarketPool, MARKET_REFRESH_INTERVAL, FURNITURE_CATALOG } from './data-advanced';
import { applyEconomy, calculateEconomy } from './engines/economy';
import { tickISO, startISO, advanceISO, canStartISO, canAdvanceISO } from './engines/iso';
import { rollEvents, applyEvents } from './engines/events';
import { tickTeam, hireMember, fireMember, canHire, getHireCost, hireFromMarket, assignZone, assignDesk } from './engines/team';
import { checkWinLose, gainExperience } from './engines/progression';
import { tickProducts, createInitialProduct } from './engines/product';

const INITIAL_MONEY = 25000;

function createInitialState(): GameState {
  return {
    player: {
      money: INITIAL_MONEY,
      reputation: 50,
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
    // Create initial company product in prototype stage
    const productDef = PRODUCTS.find(p => p.id === state.business.productId);
    const initialProduct = createInitialProduct(
      state.business.productId!,
      productDef?.name ?? 'My Product',
      state.business.monetizationId!,
    );
    const gs = toGameState({
      ...state,
      phase: 'playing',
      activeEvents: [],
      weekHistory: [],
      business: { ...state.business, companyProducts: [initialProduct] },
    });
    const withEconomy = applyEconomy(gs);
    set({
      ...withEconomy,
      phase: 'playing',
      player: { ...withEconomy.player, currentWeek: 1, gameSpeed: 1 as GameSpeed, weekProgress: 0, totalTimePlayed: 0 },
      logs: [...withEconomy.logs, { week: 1, message: '🚀 Your business is launched! Your product starts in prototype stage.', type: 'success' }],
    });
  },

  setGameSpeed: (speed) => {
    set(s => ({ player: { ...s.player, gameSpeed: speed } }));
  },

  // Called every animation frame with real delta seconds
  // SECONDS_PER_WEEK controls how fast a "week" passes in real time
  gameTick: (deltaSec) => {
    const state = get();
    if (state.phase !== 'playing' || state.player.gameSpeed === 0) return;

    const SECONDS_PER_WEEK = 10; // 1 game week = 10 real seconds at 1x
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

      gs = tickTeam(gs);
      gs = tickProducts(gs);
      gs = tickISO(gs);
      gs = applyEconomy(gs);

      const events = rollEvents(gs);
      gs = events.length > 0 ? applyEvents(gs, events) : { ...gs, activeEvents: [] };

      gs = gainExperience(gs);

      const niche = NICHES.find(n => n.id === gs.business.nicheId);
      if (niche) niche.baseDemand = Math.max(0.2, niche.baseDemand - niche.trendDecayRate);

      gs = tickTechTree(gs);
      gs = tickEmployeeMarket(gs);
      gs = { ...gs, weekHistory: [...gs.weekHistory, { ...gs.business.metrics }] };
      gs = checkWinLose(gs);
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
      logs: [...s.logs, { week: s.player.currentWeek, message: `Started researching ${node.name}.`, type: 'info' as const }],
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
      logs: [...s.logs, { week: s.player.currentWeek, message: `Office upgraded to level ${nextLevelDef.level}! Max employees: ${nextLevelDef.maxEmployees}.`, type: 'success' as const }],
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

// --- Employee point generation (continuous, called every tick) ---
// Employees sitting at desks generate points based on their zone assignment
// Zone → metric mapping: development→quality, marketing→growthRate, security→risk(-), qa→quality
function tickEmployeePointGeneration(state: GameState, weekFraction: number): GameState {
  const POINTS_PER_WEEK = 0.02; // base metric gain per employee per week
  let qualityDelta = 0;
  let growthDelta = 0;
  let riskDelta = 0;

  for (const member of state.business.team) {
    // Only generate if assigned to a placed desk
    if (!member.deskId) continue;
    const desk = state.business.furniture.find(f => f.id === member.deskId && f.position);
    if (!desk) continue;

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
  }

  if (qualityDelta === 0 && growthDelta === 0 && riskDelta === 0) return state;

  const m = state.business.metrics;
  return {
    ...state,
    business: {
      ...state.business,
      metrics: {
        ...m,
        quality: Math.min(1, Math.max(0, m.quality + qualityDelta)),
        growthRate: Math.min(1, Math.max(0, m.growthRate + growthDelta)),
        risk: Math.min(1, Math.max(0, m.risk + riskDelta)),
      },
    },
  };
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
