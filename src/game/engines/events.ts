import { GameState, GameEvent } from '../types';
import { EVENTS_POOL } from '../data';
import { getT } from '../../i18n';
import { eventTitle, eventDesc } from '../../i18n/game-text';

export function rollEvents(state: GameState): GameEvent[] {
  // Filter events whose conditions are met
  const eligible = EVENTS_POOL.filter(e => {
    if (e.condition && !e.condition(state)) return false;
    return true;
  });

  if (eligible.length === 0) return [];

  // Weighted random selection — pick 0-2 events per turn
  const totalWeight = eligible.reduce((s, e) => s + e.weight, 0);
  const picked: GameEvent[] = [];

  // Chance of event: ~60% for 1 event, ~20% for 2 events, ~20% for none
  const roll = Math.random();
  const eventCount = roll < 0.2 ? 0 : roll < 0.8 ? 1 : 2;

  for (let i = 0; i < eventCount; i++) {
    let r = Math.random() * totalWeight;
    for (const event of eligible) {
      r -= event.weight;
      if (r <= 0) {
        if (!picked.find(p => p.id === event.id)) {
          picked.push(event);
        }
        break;
      }
    }
  }

  // ISO certification reduces negative events
  const hasCertifiedISO = state.business.isoStandards.some(iso => iso.certified);
  if (hasCertifiedISO) {
    return picked.filter(e => {
      if (e.type === 'crisis') {
        return Math.random() > 0.5; // 50% chance to block crisis
      }
      return true;
    });
  }

  return picked;
}

export function applyEvents(state: GameState, events: GameEvent[]): GameState {
  let newState = { ...state };
  const newLogs = [...state.logs];

  for (const event of events) {
    const eff = event.effects;

    // Money
    if (eff.moneyDelta) {
      newState = {
        ...newState,
        player: {
          ...newState.player,
          money: newState.player.money + eff.moneyDelta,
        },
      };
    }

    // Reputation
    if (eff.reputationDelta) {
      newState = {
        ...newState,
        player: {
          ...newState.player,
          reputation: Math.max(0, Math.min(100, newState.player.reputation + eff.reputationDelta)),
        },
      };
    }

    // Demand
    if (eff.demandDelta) {
      newState = {
        ...newState,
        business: {
          ...newState.business,
          metrics: {
            ...newState.business.metrics,
            demand: Math.max(0, Math.min(1, newState.business.metrics.demand + eff.demandDelta)),
          },
        },
      };
    }

    // Risk
    if (eff.riskDelta) {
      newState = {
        ...newState,
        business: {
          ...newState.business,
          metrics: {
            ...newState.business.metrics,
            risk: Math.max(0, Math.min(1, newState.business.metrics.risk + eff.riskDelta)),
          },
        },
      };
    }

    // Quality
    if (eff.qualityDelta) {
      newState = {
        ...newState,
        business: {
          ...newState.business,
          metrics: {
            ...newState.business.metrics,
            quality: Math.max(0, Math.min(1, newState.business.metrics.quality + eff.qualityDelta)),
          },
        },
      };
    }

    // Burnout (applied to all team members)
    if (eff.burnoutDelta) {
      newState = {
        ...newState,
        business: {
          ...newState.business,
          team: newState.business.team.map(m => ({
            ...m,
            burnout: Math.max(0, Math.min(100, m.burnout + eff.burnoutDelta!)),
          })),
        },
      };
    }

    // ISO progress
    if (eff.isoProgressDelta) {
      newState = {
        ...newState,
        business: {
          ...newState.business,
          isoStandards: newState.business.isoStandards.map(iso => ({
            ...iso,
            stageProgress: Math.max(0, Math.min(100, iso.stageProgress + eff.isoProgressDelta!)),
          })),
        },
      };
    }

    const eventTypeIcon: Record<string, string> = {
      market: '📊',
      internal: '🏢',
      crisis: '🚨',
      positive: '✨',
      iso: '📋',
    };

    newLogs.push({
      week: state.player.currentWeek,
      message: `${eventTypeIcon[event.type] || '📌'} ${eventTitle(event.id, getT(), event.title)}: ${eventDesc(event.id, getT(), event.description)}`,
      type: event.type === 'crisis' ? 'danger' : event.type === 'positive' ? 'success' : 'event',
    });
  }

  return { ...newState, logs: newLogs, activeEvents: events };
}
