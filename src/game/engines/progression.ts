import { GameState, GamePhase } from '../types';
import { getT } from '../../i18n';

const IPO_THRESHOLD = 500000;
const MARKET_DOMINANCE_REPUTATION = 95;
const BANKRUPTCY_THRESHOLD = -50000;

export function checkWinLose(state: GameState): GameState {
  if (state.phase !== 'playing') return state;

  const newLogs = [...state.logs];

  // --- Lose conditions ---
  // Bankruptcy
  if (state.player.money <= BANKRUPTCY_THRESHOLD) {
    newLogs.push({
      week: state.player.currentWeek,
      message: getT().bankruptMessage,
      type: 'danger',
    });
    return { ...state, phase: 'lost', logs: newLogs };
  }

  // Reputation = 0
  if (state.player.reputation <= 0) {
    newLogs.push({
      week: state.player.currentWeek,
      message: getT().reputationCollapsed,
      type: 'danger',
    });
    return { ...state, phase: 'lost', logs: newLogs };
  }

  // --- Win conditions (soft-win) ---
  // IPO
  if (state.player.money >= IPO_THRESHOLD && state.player.reputation >= 80) {
    newLogs.push({
      week: state.player.currentWeek,
      message: getT().ipoSuccess,
      type: 'success',
    });
    return { ...state, phase: 'won', logs: newLogs };
  }

  // Market dominance
  if (state.player.reputation >= MARKET_DOMINANCE_REPUTATION && state.business.metrics.quality >= 0.9) {
    newLogs.push({
      week: state.player.currentWeek,
      message: getT().marketDominance,
      type: 'success',
    });
    return { ...state, phase: 'won', logs: newLogs };
  }

  return state;
}

export function gainExperience(state: GameState): GameState {
  const expGain = 5 + Math.floor(state.business.metrics.profit / 5000);
  const newExp = state.player.experience + Math.max(1, expGain);

  // Reputation slowly trends based on quality and profit
  const qualityEffect = (state.business.metrics.quality - 0.5) * 2;
  const profitEffect = state.business.metrics.profit > 0 ? 1 : -2;
  const repDelta = qualityEffect + profitEffect;
  const newRep = Math.max(0, Math.min(100, state.player.reputation + repDelta));

  return {
    ...state,
    player: {
      ...state.player,
      experience: newExp,
      reputation: Math.round(newRep),
    },
  };
}
