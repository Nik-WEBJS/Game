import { GameState, CombinationResult, LIFECYCLE_REVENUE_MULT, EMPLOYEE_LEVEL_OUTPUT_MULT } from '../types';
import { NICHES, PRODUCTS, TECHNOLOGIES, MARKETS, MONETIZATIONS } from '../data';

export function calculateCombination(state: GameState): CombinationResult {
  const { business } = state;

  const niche = NICHES.find(n => n.id === business.nicheId);
  const product = PRODUCTS.find(p => p.id === business.productId);
  const market = MARKETS.find(m => m.id === business.marketId);
  const monetization = MONETIZATIONS.find(m => m.id === business.monetizationId);

  if (!niche || !product || !market || !monetization) {
    return { revenue: 0, growth: 0, risk: 0.1, quality: 0, demand: 0 };
  }

  // Base niche values
  const baseDemand = niche.baseDemand;
  const baseComplexity = niche.baseComplexity;

  // Product fit coefficient (0..2)
  const productFit = product.nicheFit[niche.id] ?? 1.0;

  // Tech synergy: count synergy pairs among adopted techs
  const adoptedTechs = TECHNOLOGIES.filter(t => business.technologies.includes(t.id));
  let synergyCount = 0;
  let totalComplexity = 0;
  let totalQualityBonus = 0;

  for (const tech of adoptedTechs) {
    totalComplexity += tech.complexityAdd;
    totalQualityBonus += tech.qualityBonus;
    for (const synId of tech.synergyWith) {
      if (business.technologies.includes(synId)) {
        synergyCount++;
      }
    }
  }
  synergyCount = Math.floor(synergyCount / 2); // each pair counted twice
  const techSynergy = 1.0 + synergyCount * 0.08;

  // Tech tree bonuses from completed research
  let ttQuality = 0;
  let ttGrowth = 0;
  let ttRisk = 0;
  for (const node of business.techTree) {
    if (!node.completed) continue;
    ttQuality += node.effects.qualityMod ?? 0;
    ttGrowth += node.effects.growthMod ?? 0;
    ttRisk += node.effects.riskMod ?? 0;
  }

  // Market modifier
  const marketAccess = market.accessModifier * market.demandMultiplier;

  // ISO modifiers
  let isoStabilization = 0;
  for (const iso of business.isoStandards) {
    if (iso.certified) {
      isoStabilization += iso.stabilizationBonus;
    }
  }

  // Team efficiency with employee levels
  const teamEff = business.metrics.teamEfficiency || 0.3;
  const avgLevelMult = business.team.length > 0
    ? business.team.reduce((s, m) => s + (EMPLOYEE_LEVEL_OUTPUT_MULT[(m.level || 1) - 1] ?? 1), 0) / business.team.length
    : 1;

  // Quality = base product quality + tech bonuses + team efficiency + tech tree
  const quality = Math.min(1, Math.max(0,
    product.quality + totalQualityBonus + teamEff * 0.15 * avgLevelMult + ttQuality
  ));

  // Demand = baseDemand * productFit * marketAccess, capped at 1
  const demand = Math.min(1, baseDemand * productFit * marketAccess);

  // Product lifecycle revenue multiplier (from company products)
  let lifecycleMult = 0;
  if (business.companyProducts.length > 0) {
    lifecycleMult = business.companyProducts.reduce((sum, cp) => {
      return sum + (LIFECYCLE_REVENUE_MULT[cp.lifecycle] ?? 0);
    }, 0) / business.companyProducts.length;
  }

  // Revenue = demand * quality * monetization * techSynergy * lifecycle * scale
  // Much lower base scale — revenue must be earned through good product + team
  const BASE_REVENUE_SCALE = 15000;
  const revenue = demand * quality * monetization.efficiency * techSynergy * lifecycleMult * BASE_REVENUE_SCALE;

  // Growth = revenue potential relative to current state + tech tree growth
  const growth = (demand * productFit * techSynergy - 0.5) * 0.08 + ttGrowth;

  // Risk = complexity + growth aggression - ISO stabilization - tech tree risk reduction
  const growthAggression = Math.max(0, growth) * 1.5;
  const teamLoad = business.team.length > 0
    ? business.team.reduce((sum, m) => sum + m.burnout, 0) / (business.team.length * 100)
    : 0.3;
  const risk = Math.max(0, Math.min(1,
    baseComplexity * 0.3
    + totalComplexity * 0.4
    + growthAggression
    + teamLoad * 0.3
    + monetization.riskModifier
    - isoStabilization
    + ttRisk
  ));

  return { revenue, growth, risk, quality, demand };
}
