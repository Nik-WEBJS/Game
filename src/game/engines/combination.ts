import { GameState, CombinationResult } from '../types';
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
  const techSynergy = 1.0 + synergyCount * 0.1;

  // Market modifier
  const marketAccess = market.accessModifier * market.demandMultiplier;

  // ISO modifiers
  let isoStabilization = 0;
  for (const iso of business.isoStandards) {
    if (iso.certified) {
      isoStabilization += iso.stabilizationBonus;
    }
  }

  // Quality = base product quality + tech bonuses + team efficiency, capped at 1
  const teamEff = business.metrics.teamEfficiency || 0.5;
  const quality = Math.min(1, product.quality + totalQualityBonus + teamEff * 0.2);

  // Demand = baseDemand * productFit * marketAccess, capped at 1
  const demand = Math.min(1, baseDemand * productFit * marketAccess);

  // Revenue = demand * quality * monetization efficiency * base scale
  const BASE_REVENUE_SCALE = 50000;
  const revenue = demand * quality * monetization.efficiency * techSynergy * BASE_REVENUE_SCALE;

  // Growth = revenue potential relative to current state
  const growth = (demand * productFit * techSynergy - 0.5) * 0.1;

  // Risk = complexity + growth aggression - ISO stabilization
  const growthAggression = Math.max(0, growth) * 2;
  const teamLoad = business.team.length > 0
    ? business.team.reduce((sum, m) => sum + m.burnout, 0) / (business.team.length * 100)
    : 0.2;
  const risk = Math.max(0, Math.min(1,
    baseComplexity * 0.3
    + totalComplexity * 0.5
    + growthAggression
    + teamLoad * 0.3
    + monetization.riskModifier
    - isoStabilization
  ));

  return { revenue, growth, risk, quality, demand };
}
