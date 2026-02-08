import { GameState, BusinessMetrics } from '../types';
import { TECHNOLOGIES } from '../data';
import { calculateCombination } from './combination';

export function calculateEconomy(state: GameState): BusinessMetrics {
  const { business } = state;
  const combo = calculateCombination(state);

  // --- Revenue ---
  const revenue = combo.revenue;

  // --- Costs ---
  const teamSalaries = business.team.reduce((sum, m) => sum + m.salary, 0);

  const adoptedTechs = TECHNOLOGIES.filter(t => business.technologies.includes(t.id));
  const infrastructure = adoptedTechs.reduce((sum, t) => sum + t.cost * 0.1, 0); // 10% of cost per turn

  const isoMaintenance = business.isoStandards
    .filter(iso => iso.currentStage !== 'none')
    .reduce((sum, iso) => {
      if (iso.certified) return sum + iso.maintenanceCost;
      return sum + iso.maintenanceCost * 0.5; // half cost during implementation
    }, 0);

  const techComplexityCost = adoptedTechs.reduce((sum, t) => sum + t.complexityAdd * 2000, 0);

  const costs = teamSalaries + infrastructure + isoMaintenance + techComplexityCost;

  // --- Profit ---
  const profit = revenue - costs;

  // --- Team Efficiency ---
  let teamEfficiency = 0.5; // default if no team
  if (business.team.length > 0) {
    const avgExperience = business.team.reduce((s, m) => s + m.experience, 0) / business.team.length;
    const avgBurnout = business.team.reduce((s, m) => s + m.burnout, 0) / business.team.length;

    const hasManager = business.team.some(m => m.role === 'manager');
    const processQuality = hasManager ? 1.15 : 0.9;

    const isoSupport = business.isoStandards.some(iso => iso.certified) ? 1.1 : 1.0;

    teamEfficiency = Math.min(1, Math.max(0.1,
      (avgExperience / 100) * processQuality * isoSupport * (1 - avgBurnout / 150)
    ));
  }

  return {
    revenue,
    costs,
    profit,
    risk: combo.risk,
    quality: combo.quality,
    demand: combo.demand,
    growthRate: combo.growth,
    teamEfficiency,
  };
}

export function applyEconomy(state: GameState): GameState {
  const metrics = calculateEconomy(state);
  const newMoney = state.player.money + metrics.profit;

  return {
    ...state,
    player: {
      ...state.player,
      money: Math.round(newMoney),
    },
    business: {
      ...state.business,
      metrics,
    },
  };
}
