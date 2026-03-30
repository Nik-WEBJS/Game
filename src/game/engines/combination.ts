import { GameState, CombinationResult, LIFECYCLE_REVENUE_MULT, EMPLOYEE_LEVEL_OUTPUT_MULT } from '../types';
import { NICHES, PRODUCTS, TECHNOLOGIES, MARKETS, MONETIZATIONS } from '../data';
import { BALANCE } from '../config/balance';

export interface CombinationBreakdown {
  result: CombinationResult;
  factors: {
    hasEmployees: boolean;
    baseDemand: number;
    baseComplexity: number;
    productFit: number;
    marketAccess: number;
    monetizationEfficiency: number;
    monetizationRiskModifier: number;
    totalTechComplexity: number;
    totalTechQualityBonus: number;
    synergyCount: number;
    techSynergy: number;
    teamEfficiency: number;
    avgLevelMult: number;
    techTreeQuality: number;
    techTreeGrowth: number;
    techTreeRisk: number;
    avgAudience: number;
    lifecycleMult: number;
    clientTierMult: number;
    isoStabilization: number;
    growthAggression: number;
    teamLoad: number;
  };
}

export function calculateCombination(state: GameState): CombinationResult {
  return calculateCombinationBreakdown(state).result;
}

export function calculateCombinationBreakdown(state: GameState): CombinationBreakdown {
  const { business } = state;

  const niche = NICHES.find(n => n.id === business.nicheId);
  const product = PRODUCTS.find(p => p.id === business.productId);
  const market = MARKETS.find(m => m.id === business.marketId);
  const monetization = MONETIZATIONS.find(m => m.id === business.monetizationId);

  if (!niche || !product || !market || !monetization) {
    return {
      result: { revenue: 0, growth: 0, risk: 0.1, quality: 0, demand: 0 },
      factors: {
        hasEmployees: false,
        baseDemand: 0,
        baseComplexity: 0,
        productFit: 1,
        marketAccess: 1,
        monetizationEfficiency: 0,
        monetizationRiskModifier: 0,
        totalTechComplexity: 0,
        totalTechQualityBonus: 0,
        synergyCount: 0,
        techSynergy: 1,
        teamEfficiency: 0,
        avgLevelMult: 1,
        techTreeQuality: 0,
        techTreeGrowth: 0,
        techTreeRisk: 0,
        avgAudience: 0,
        lifecycleMult: 0,
        clientTierMult: 0,
        isoStabilization: 0,
        growthAggression: 0,
        teamLoad: 0,
      },
    };
  }

  // Base niche values
  const baseDemand = niche.baseDemand;
  const baseComplexity = niche.baseComplexity;

  // Product fit coefficient (0..2)
  const productFit = product.nicheFit[niche.id] ?? 1.0;

  // No revenue without employees
  const hasEmployees = business.team.filter(m => m.status === 'office').length > 0;

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

  // Demand is driven by product audience (built by marketers), NOT static
  // baseDemand is a ceiling — audience determines how much of it you've captured
  const avgAudience = business.companyProducts.length > 0
    ? business.companyProducts.reduce((s, cp) => s + cp.audience, 0) / business.companyProducts.length
    : 0;
  const demand = Math.min(1, baseDemand * productFit * marketAccess * avgAudience);

  // Product lifecycle revenue multiplier (from company products)
  let lifecycleMult = 0;
  if (business.companyProducts.length > 0) {
    lifecycleMult = business.companyProducts.reduce((sum, cp) => {
      return sum + (LIFECYCLE_REVENUE_MULT[cp.lifecycle] ?? 0);
    }, 0) / business.companyProducts.length;
  }

  // --- Client tier multiplier ---
  // Early game: small clients only. As reputation + time grow, bigger clients appear.
  // reputation 0-30: indie/small (×0.3), 30-60: mid-market (×0.7), 60-80: enterprise (×1.0), 80+: big tech (×1.3)
  const rep = state.player.reputation;
  const weeksPlayed = state.player.currentWeek;
  const timeFactor = Math.min(1, weeksPlayed / 52); // ramps over ~1 year
  const repTier = rep < 30 ? 0.3 : rep < 60 ? 0.7 : rep < 80 ? 1.0 : 1.3;
  const clientTierMult = repTier * (0.4 + timeFactor * 0.6); // starts at 40% of tier, grows to 100%

  // Revenue = demand * quality * monetization * techSynergy * lifecycle * clientTier * scale
  // No revenue without employees or if product is in prototype
  const BASE_REVENUE_SCALE = BALANCE.economy.baseRevenueScale;
  const revenue = hasEmployees
    ? demand * quality * monetization.efficiency * techSynergy * lifecycleMult * clientTierMult * BASE_REVENUE_SCALE
    : 0;

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

  return {
    result: { revenue, growth, risk, quality, demand },
    factors: {
      hasEmployees,
      baseDemand,
      baseComplexity,
      productFit,
      marketAccess,
      monetizationEfficiency: monetization.efficiency,
      monetizationRiskModifier: monetization.riskModifier,
      totalTechComplexity: totalComplexity,
      totalTechQualityBonus: totalQualityBonus,
      synergyCount,
      techSynergy,
      teamEfficiency: teamEff,
      avgLevelMult,
      techTreeQuality: ttQuality,
      techTreeGrowth: ttGrowth,
      techTreeRisk: ttRisk,
      avgAudience,
      lifecycleMult,
      clientTierMult,
      isoStabilization,
      growthAggression,
      teamLoad,
    },
  };
}
