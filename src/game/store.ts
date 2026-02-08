import { create } from 'zustand';
import { GameState, GamePhase, TeamRole, BusinessMetrics } from './types';
import { NICHES, PRODUCTS, TECHNOLOGIES, MARKETS, MONETIZATIONS, createISO9001 } from './data';
import { applyEconomy, calculateEconomy } from './engines/economy';
import { tickISO, startISO, advanceISO, canStartISO, canAdvanceISO } from './engines/iso';
import { rollEvents, applyEvents } from './engines/events';
import { tickTeam, hireMember, fireMember, canHire, getHireCost } from './engines/team';
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
      productId: null,
      monetizationId: null,
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
    weekHistory: [],
  };
}

interface GameStore extends GameState {
  // Actions
  setNiche: (nicheId: string) => void;
  setProduct: (productId: string) => void;
  setMonetization: (monetizationId: string) => void;
  adoptTechnology: (techId: string) => void;
  removeTechnology: (techId: string) => void;
  startGame: () => void;
  nextTurn: () => void;
  hireTeamMember: (role: TeamRole) => void;
  fireTeamMember: (memberId: string) => void;
  startISOProcess: (isoId: string) => void;
  advanceISOStage: (isoId: string) => void;
  resetGame: () => void;
  canStartISO: (isoId: string) => boolean;
  canAdvanceISO: (isoId: string) => boolean;
  canHireMember: (role: TeamRole) => boolean;
  getHireCost: (role: TeamRole) => number;
  previewMetrics: () => BusinessMetrics;
}

export const useGameStore = create<GameStore>((set, get) => ({
  ...createInitialState(),

  setNiche: (nicheId: string) => {
    set(state => ({
      business: { ...state.business, nicheId },
    }));
  },

  setProduct: (productId: string) => {
    set(state => ({
      business: { ...state.business, productId },
    }));
  },

  setMonetization: (monetizationId: string) => {
    set(state => ({
      business: { ...state.business, monetizationId },
    }));
  },

  adoptTechnology: (techId: string) => {
    const state = get();
    const tech = TECHNOLOGIES.find(t => t.id === techId);
    if (!tech || state.business.technologies.includes(techId)) return;
    if (state.player.money < tech.cost) return;

    set(s => ({
      player: { ...s.player, money: s.player.money - tech.cost },
      business: {
        ...s.business,
        technologies: [...s.business.technologies, techId],
      },
      logs: [
        ...s.logs,
        { week: s.player.currentWeek, message: `Adopted ${tech.name} for $${tech.cost.toLocaleString()}.`, type: 'info' as const },
      ],
    }));
  },

  removeTechnology: (techId: string) => {
    set(state => ({
      business: {
        ...state.business,
        technologies: state.business.technologies.filter(t => t !== techId),
      },
    }));
  },

  startGame: () => {
    const state = get();
    if (!state.business.nicheId || !state.business.productId || !state.business.monetizationId) return;

    const fullState: GameState = {
      player: state.player,
      business: state.business,
      phase: 'playing',
      logs: state.logs,
      activeEvents: [],
      availableNiches: state.availableNiches,
      availableProducts: state.availableProducts,
      availableTechnologies: state.availableTechnologies,
      availableMarkets: state.availableMarkets,
      availableMonetizations: state.availableMonetizations,
      weekHistory: [],
    };

    const withEconomy = applyEconomy(fullState);

    set({
      ...withEconomy,
      phase: 'playing',
      player: { ...withEconomy.player, currentWeek: 1 },
      logs: [
        ...withEconomy.logs,
        { week: 1, message: '🚀 Your business is launched! Good luck!', type: 'success' },
      ],
    });
  },

  nextTurn: () => {
    const state = get();
    if (state.phase !== 'playing') return;

    let gameState: GameState = {
      player: state.player,
      business: state.business,
      phase: state.phase,
      logs: state.logs,
      activeEvents: state.activeEvents,
      availableNiches: state.availableNiches,
      availableProducts: state.availableProducts,
      availableTechnologies: state.availableTechnologies,
      availableMarkets: state.availableMarkets,
      availableMonetizations: state.availableMonetizations,
      weekHistory: state.weekHistory,
    };

    // 1. Advance week
    gameState = {
      ...gameState,
      player: { ...gameState.player, currentWeek: gameState.player.currentWeek + 1 },
    };

    // 2. Tick team (experience, burnout, morale)
    gameState = tickTeam(gameState);

    // 3. Tick ISO
    gameState = tickISO(gameState);

    // 4. Calculate economy
    gameState = applyEconomy(gameState);

    // 5. Roll and apply events
    const events = rollEvents(gameState);
    if (events.length > 0) {
      gameState = applyEvents(gameState, events);
    } else {
      gameState = { ...gameState, activeEvents: [] };
    }

    // 6. Gain experience & reputation
    gameState = gainExperience(gameState);

    // 7. Decay niche demand (trends age)
    const niche = NICHES.find(n => n.id === gameState.business.nicheId);
    if (niche) {
      niche.baseDemand = Math.max(0.2, niche.baseDemand - niche.trendDecayRate);
    }

    // 8. Record history
    gameState = {
      ...gameState,
      weekHistory: [...gameState.weekHistory, { ...gameState.business.metrics }],
    };

    // 9. Check win/lose
    gameState = checkWinLose(gameState);

    set(gameState);
  },

  hireTeamMember: (role: TeamRole) => {
    const state = get();
    const gameState: GameState = {
      player: state.player,
      business: state.business,
      phase: state.phase,
      logs: state.logs,
      activeEvents: state.activeEvents,
      availableNiches: state.availableNiches,
      availableProducts: state.availableProducts,
      availableTechnologies: state.availableTechnologies,
      availableMarkets: state.availableMarkets,
      availableMonetizations: state.availableMonetizations,
      weekHistory: state.weekHistory,
    };
    const result = hireMember(gameState, role);
    set(result);
  },

  fireTeamMember: (memberId: string) => {
    const state = get();
    const gameState: GameState = {
      player: state.player,
      business: state.business,
      phase: state.phase,
      logs: state.logs,
      activeEvents: state.activeEvents,
      availableNiches: state.availableNiches,
      availableProducts: state.availableProducts,
      availableTechnologies: state.availableTechnologies,
      availableMarkets: state.availableMarkets,
      availableMonetizations: state.availableMonetizations,
      weekHistory: state.weekHistory,
    };
    const result = fireMember(gameState, memberId);
    set(result);
  },

  startISOProcess: (isoId: string) => {
    const state = get();
    const gameState: GameState = {
      player: state.player,
      business: state.business,
      phase: state.phase,
      logs: state.logs,
      activeEvents: state.activeEvents,
      availableNiches: state.availableNiches,
      availableProducts: state.availableProducts,
      availableTechnologies: state.availableTechnologies,
      availableMarkets: state.availableMarkets,
      availableMonetizations: state.availableMonetizations,
      weekHistory: state.weekHistory,
    };
    const result = startISO(gameState, isoId);
    set(result);
  },

  advanceISOStage: (isoId: string) => {
    const state = get();
    const gameState: GameState = {
      player: state.player,
      business: state.business,
      phase: state.phase,
      logs: state.logs,
      activeEvents: state.activeEvents,
      availableNiches: state.availableNiches,
      availableProducts: state.availableProducts,
      availableTechnologies: state.availableTechnologies,
      availableMarkets: state.availableMarkets,
      availableMonetizations: state.availableMonetizations,
      weekHistory: state.weekHistory,
    };
    const result = advanceISO(gameState, isoId);
    set(result);
  },

  resetGame: () => {
    set(createInitialState());
  },

  canStartISO: (isoId: string) => {
    const state = get();
    const gameState: GameState = {
      player: state.player,
      business: state.business,
      phase: state.phase,
      logs: state.logs,
      activeEvents: state.activeEvents,
      availableNiches: state.availableNiches,
      availableProducts: state.availableProducts,
      availableTechnologies: state.availableTechnologies,
      availableMarkets: state.availableMarkets,
      availableMonetizations: state.availableMonetizations,
      weekHistory: state.weekHistory,
    };
    return canStartISO(gameState, isoId);
  },

  canAdvanceISO: (isoId: string) => {
    const state = get();
    const gameState: GameState = {
      player: state.player,
      business: state.business,
      phase: state.phase,
      logs: state.logs,
      activeEvents: state.activeEvents,
      availableNiches: state.availableNiches,
      availableProducts: state.availableProducts,
      availableTechnologies: state.availableTechnologies,
      availableMarkets: state.availableMarkets,
      availableMonetizations: state.availableMonetizations,
      weekHistory: state.weekHistory,
    };
    return canAdvanceISO(gameState, isoId);
  },

  canHireMember: (role: TeamRole) => {
    const state = get();
    const gameState: GameState = {
      player: state.player,
      business: state.business,
      phase: state.phase,
      logs: state.logs,
      activeEvents: state.activeEvents,
      availableNiches: state.availableNiches,
      availableProducts: state.availableProducts,
      availableTechnologies: state.availableTechnologies,
      availableMarkets: state.availableMarkets,
      availableMonetizations: state.availableMonetizations,
      weekHistory: state.weekHistory,
    };
    return canHire(gameState, role);
  },

  getHireCost: (role: TeamRole) => {
    return getHireCost(role);
  },

  previewMetrics: () => {
    const state = get();
    const gameState: GameState = {
      player: state.player,
      business: state.business,
      phase: state.phase,
      logs: state.logs,
      activeEvents: state.activeEvents,
      availableNiches: state.availableNiches,
      availableProducts: state.availableProducts,
      availableTechnologies: state.availableTechnologies,
      availableMarkets: state.availableMarkets,
      availableMonetizations: state.availableMonetizations,
      weekHistory: state.weekHistory,
    };
    return calculateEconomy(gameState);
  },
}));
