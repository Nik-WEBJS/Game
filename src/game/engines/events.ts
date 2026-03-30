import { GameState, GameEvent } from '../types';
import { EVENTS_POOL } from '../data';
import { getT } from '../../i18n';
import { eventTitle, eventDesc } from '../../i18n/game-text';

// Event frequency and penalty scaling based on game progression
function getProgressionScale(state: GameState): { frequencyMult: number; penaltyMult: number } {
  // Product lifecycle stage affects event intensity
  const product = state.business.companyProducts[0];
  const lifecycle = product?.lifecycle ?? 'prototype';
  const lifecycleScale: Record<string, number> = {
    prototype: 0.15, // almost no events
    beta: 0.3,
    release: 0.6,
    growth: 0.85,
    maturity: 1.0,
    decline: 1.0,
  };
  const stageMult = lifecycleScale[lifecycle] ?? 0.15;

  // More adopted technologies = more exposure to events
  const techCount = state.business.technologies.length;
  const techMult = Math.min(1, 0.4 + techCount * 0.15); // 0.4 base, +0.15 per tech, cap 1.0

  // Combine: early game with no tech = very few events
  const frequencyMult = stageMult * techMult;

  // Money penalties scale similarly (early = small fines)
  const penaltyMult = Math.max(0.2, stageMult);

  return { frequencyMult, penaltyMult };
}

export function rollEvents(state: GameState): GameEvent[] {
  // Filter events whose conditions are met
  const eligible = EVENTS_POOL.filter(e => {
    if (e.condition && !e.condition(state)) return false;
    return true;
  });

  if (eligible.length === 0) return [];

  const { frequencyMult } = getProgressionScale(state);

  // Weighted random selection — pick 0-2 events per turn
  const totalWeight = eligible.reduce((s, e) => s + e.weight, 0);
  const picked: GameEvent[] = [];

  // Base chance scaled by progression: early game = mostly no events
  const roll = Math.random();
  const noEventChance = 0.2 + (1 - frequencyMult) * 0.6; // prototype: ~78% no event, growth: ~29%
  const oneEventChance = noEventChance + (1 - noEventChance) * 0.75;
  const eventCount = roll < noEventChance ? 0 : roll < oneEventChance ? 1 : 2;

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
  const { penaltyMult } = getProgressionScale(state);

  for (const event of events) {
    const eff = event.effects;

    // Money — scale negative penalties by progression
    if (eff.moneyDelta) {
      const scaledMoney = eff.moneyDelta < 0
        ? Math.round(eff.moneyDelta * penaltyMult)
        : eff.moneyDelta;
      newState = {
        ...newState,
        player: {
          ...newState.player,
          money: newState.player.money + scaledMoney,
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

    const details: string[] = [];
    if (eff.moneyDelta) {
      const scaledMoney = eff.moneyDelta < 0
        ? Math.round(eff.moneyDelta * penaltyMult)
        : eff.moneyDelta;
      details.push(`money ${scaledMoney > 0 ? '+' : ''}$${Math.abs(scaledMoney).toLocaleString()}`);
    }
    if (eff.reputationDelta) details.push(`rep ${eff.reputationDelta > 0 ? '+' : ''}${eff.reputationDelta}`);
    if (eff.demandDelta) details.push(`demand ${eff.demandDelta > 0 ? '+' : ''}${(eff.demandDelta * 100).toFixed(1)}pp`);
    if (eff.qualityDelta) details.push(`quality ${eff.qualityDelta > 0 ? '+' : ''}${(eff.qualityDelta * 100).toFixed(1)}pp`);
    if (eff.riskDelta) details.push(`risk ${eff.riskDelta > 0 ? '+' : ''}${(eff.riskDelta * 100).toFixed(1)}pp`);
    if (eff.burnoutDelta) details.push(`burnout ${eff.burnoutDelta > 0 ? '+' : ''}${eff.burnoutDelta}`);
    if (eff.isoProgressDelta) details.push(`iso ${eff.isoProgressDelta > 0 ? '+' : ''}${eff.isoProgressDelta}`);

    newLogs.push({
      week: state.player.currentWeek,
      message: `${eventTypeIcon[event.type] || '📌'} ${eventTitle(event.id, getT(), event.title)}: ${eventDesc(event.id, getT(), event.description)}${details.length ? ` [${details.join(', ')}]` : ''}`,
      type: event.type === 'crisis' ? 'danger' : event.type === 'positive' ? 'success' : 'event',
    });
  }

  return { ...newState, logs: newLogs, activeEvents: events };
}
