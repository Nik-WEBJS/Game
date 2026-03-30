import { GameState, ProductFeatureEffects, ProductFeatureState, ProductFeatureTemplate } from '../types';
import { MONETIZATIONS } from '../data';
import { getFeatureTemplateById, PRODUCT_FEATURE_TEMPLATES } from '../data-product';

const ACTIVE_USERS_AUDIENCE_SCALE = 200000;

function clamp(min: number, max: number, value: number): number {
  return Math.max(min, Math.min(max, value));
}

function getInstalledFeatureEffects(features: ProductFeatureState[]): ProductFeatureEffects {
  const sum: ProductFeatureEffects = {
    trafficBoost: 0,
    conversionBoost: 0,
    retentionBoost: 0,
    satisfactionBoost: 0,
    monetizationBoost: 0,
    reliabilityBoost: 0,
  };

  for (const feature of features) {
    if (!feature.installed) continue;
    const tpl = getFeatureTemplateById(feature.id);
    if (!tpl) continue;
    const lvl = Math.max(1, feature.level);
    sum.trafficBoost += (tpl.effects.trafficBoost ?? 0) * lvl;
    sum.conversionBoost += (tpl.effects.conversionBoost ?? 0) * lvl;
    sum.retentionBoost += (tpl.effects.retentionBoost ?? 0) * lvl;
    sum.satisfactionBoost += (tpl.effects.satisfactionBoost ?? 0) * lvl;
    sum.monetizationBoost += (tpl.effects.monetizationBoost ?? 0) * lvl;
    sum.reliabilityBoost += (tpl.effects.reliabilityBoost ?? 0) * lvl;
  }
  return sum;
}

function getUsedSlots(features: ProductFeatureState[]): number {
  return features
    .filter(f => f.installed)
    .reduce((sum, f) => sum + (getFeatureTemplateById(f.id)?.slotCost ?? 0), 0);
}

function buildBreakdown(
  growthTraffic: number,
  conversion: number,
  churn: number,
  effects: ProductFeatureEffects,
  metrics: GameState['business']['metrics'],
): { positives: string[]; negatives: string[]; bottlenecks: string[] } {
  const positive: { label: string; value: number }[] = [];
  const negative: { label: string; value: number }[] = [];

  const factors = [
    { label: 'Marketing output', value: growthTraffic * 0.8 },
    { label: 'Feature traffic boost', value: effects.trafficBoost },
    { label: 'Feature conversion boost', value: effects.conversionBoost },
    { label: 'Feature retention boost', value: effects.retentionBoost },
    { label: 'Feature reliability boost', value: effects.reliabilityBoost },
    { label: 'Quality influence', value: metrics.quality - 0.5 },
    { label: 'Risk pressure', value: -metrics.risk },
    { label: 'Churn pressure', value: -churn },
    { label: 'Conversion quality', value: conversion - 0.1 },
  ];

  for (const factor of factors) {
    if (factor.value >= 0) positive.push(factor);
    else negative.push(factor);
  }

  positive.sort((a, b) => b.value - a.value);
  negative.sort((a, b) => a.value - b.value);

  const bottlenecks: string[] = [];
  if (conversion < 0.08) bottlenecks.push('Low conversion is limiting signups');
  if (churn > 0.12) bottlenecks.push('High churn is shrinking active users');
  if (metrics.risk > 0.55) bottlenecks.push('Business risk is suppressing product growth');
  if (effects.reliabilityBoost < 0.02) bottlenecks.push('Weak infrastructure feature depth');
  if (metrics.quality < 0.45) bottlenecks.push('Low product quality harms satisfaction');

  return {
    positives: positive.slice(0, 3).map(p => p.label),
    negatives: negative.slice(0, 3).map(n => n.label),
    bottlenecks: bottlenecks.slice(0, 4),
  };
}

export function tickLiveProduct(state: GameState): GameState {
  const live = state.business.liveProduct;
  if (!live) return state;

  const effects = getInstalledFeatureEffects(live.features);
  const marketingCount = state.business.team.filter(m => m.role === 'marketing' && m.status === 'office').length;
  const strategy = MONETIZATIONS.find(m => m.id === state.business.monetizationId);
  const strategyEff = strategy?.efficiency ?? 0.5;

  const trafficGrowth = clamp(
    -0.25,
    0.5,
    0.025
      + marketingCount * 0.012
      + effects.trafficBoost
      + state.player.reputation / 1000
      + state.business.metrics.growthRate * 0.4
      - state.business.metrics.risk * 0.06
      + effects.reliabilityBoost * 0.3,
  );
  const traffic = Math.max(80, live.metrics.traffic * (1 + trafficGrowth));

  const conversion = clamp(
    0.02,
    0.45,
    0.05
      + effects.conversionBoost
      + live.metrics.satisfaction * 0.08
      + state.business.metrics.quality * 0.06
      - state.business.metrics.risk * 0.03,
  );
  const signups = traffic * conversion;

  const churn = clamp(
    0.01,
    0.35,
    0.11
      - effects.retentionBoost
      - live.metrics.satisfaction * 0.07
      + state.business.metrics.risk * 0.08
      - effects.reliabilityBoost * 0.5,
  );

  const activeUsers = Math.max(0, live.metrics.activeUsers * (1 - churn) + signups * 0.65);

  const paidConversion = clamp(
    0.005,
    0.35,
    0.018
      + effects.monetizationBoost
      + strategyEff * 0.045
      + conversion * 0.08
      - churn * 0.2,
  );
  const payingUsers = Math.min(activeUsers, activeUsers * paidConversion);

  const satisfaction = clamp(
    0.1,
    0.99,
    live.metrics.satisfaction
      + (state.business.metrics.quality - 0.5) * 0.05
      + effects.satisfactionBoost
      + effects.reliabilityBoost * 0.3
      - churn * 0.08
      - state.business.metrics.risk * 0.03,
  );

  const breakdown = buildBreakdown(trafficGrowth, conversion, churn, effects, state.business.metrics);

  const updatedLive = {
    ...live,
    metrics: {
      traffic: Math.round(traffic),
      signups: Math.round(signups),
      activeUsers: Math.round(activeUsers),
      payingUsers: Math.round(payingUsers),
      satisfaction,
      conversion,
      churn,
    },
    lastWeek: {
      topPositiveFactors: breakdown.positives,
      topNegativeFactors: breakdown.negatives,
      bottlenecks: breakdown.bottlenecks,
    },
  };

  const audienceRatio = clamp(0, 1, updatedLive.metrics.activeUsers / ACTIVE_USERS_AUDIENCE_SCALE);
  const updatedProducts = state.business.companyProducts.map((cp, idx) =>
    idx === 0 ? { ...cp, audience: audienceRatio } : cp,
  );

  return {
    ...state,
    business: {
      ...state.business,
      liveProduct: updatedLive,
      companyProducts: updatedProducts,
    },
  };
}

export function canInstallFeature(state: GameState, featureId: string): { ok: boolean; reason?: string } {
  const live = state.business.liveProduct;
  const tpl = getFeatureTemplateById(featureId);
  if (!live || !tpl) return { ok: false, reason: 'not_found' };
  if (live.features.some(f => f.id === featureId && f.installed)) return { ok: false, reason: 'already_installed' };
  if (tpl.compatibleProductTypes && !tpl.compatibleProductTypes.includes(live.productType)) return { ok: false, reason: 'incompatible_product' };
  if (tpl.requiredReputation && state.player.reputation < tpl.requiredReputation) return { ok: false, reason: 'reputation_required' };
  if ((tpl.requiredFeatureIds ?? []).some(req => !live.features.some(f => f.id === req && f.installed))) return { ok: false, reason: 'missing_prerequisites' };
  if (state.player.money < tpl.unlockCost) return { ok: false, reason: 'not_enough_money' };
  const used = getUsedSlots(live.features);
  if (used + tpl.slotCost > live.featureSlots) return { ok: false, reason: 'no_slots' };
  return { ok: true };
}

export function installFeature(state: GameState, featureId: string): GameState {
  const check = canInstallFeature(state, featureId);
  if (!check.ok) return state;
  const live = state.business.liveProduct!;
  const tpl = getFeatureTemplateById(featureId)!;
  const existing = live.features.find(f => f.id === featureId);
  const features = existing
    ? live.features.map(f => (f.id === featureId ? { ...f, installed: true, level: Math.max(1, f.level) } : f))
    : [...live.features, { id: featureId, level: 1, installed: true }];

  return {
    ...state,
    player: { ...state.player, money: state.player.money - tpl.unlockCost },
    business: {
      ...state.business,
      liveProduct: { ...live, features },
    },
    logs: [
      ...state.logs,
      {
        week: state.player.currentWeek,
        type: 'info',
        message: `Feature installed: ${tpl.name} ($${tpl.unlockCost.toLocaleString()})`,
      },
    ],
  };
}

function getFeatureLevelUpCost(featureId: string, currentLevel: number): number {
  const tpl = getFeatureTemplateById(featureId);
  if (!tpl) return 0;
  return Math.round(tpl.levelUpCostBase * (1 + currentLevel * 0.6));
}

export function canUpgradeFeature(state: GameState, featureId: string): { ok: boolean; reason?: string; cost?: number } {
  const live = state.business.liveProduct;
  if (!live) return { ok: false, reason: 'not_found' };
  const feature = live.features.find(f => f.id === featureId && f.installed);
  const tpl = getFeatureTemplateById(featureId);
  if (!feature || !tpl) return { ok: false, reason: 'not_installed' };
  if (feature.level >= tpl.maxLevel) return { ok: false, reason: 'max_level' };
  const cost = getFeatureLevelUpCost(featureId, feature.level);
  if (state.player.money < cost) return { ok: false, reason: 'not_enough_money', cost };
  return { ok: true, cost };
}

export function upgradeFeature(state: GameState, featureId: string): GameState {
  const check = canUpgradeFeature(state, featureId);
  if (!check.ok) return state;
  const live = state.business.liveProduct!;
  const tpl = getFeatureTemplateById(featureId)!;
  const cost = check.cost ?? 0;

  return {
    ...state,
    player: { ...state.player, money: state.player.money - cost },
    business: {
      ...state.business,
      liveProduct: {
        ...live,
        features: live.features.map(f => (f.id === featureId ? { ...f, level: f.level + 1 } : f)),
      },
    },
    logs: [
      ...state.logs,
      {
        week: state.player.currentWeek,
        type: 'success',
        message: `Feature upgraded: ${tpl.name} -> Lv${(live.features.find(f => f.id === featureId)?.level ?? 1) + 1}`,
      },
    ],
  };
}

export function getFeatureSlotUpgradeCost(state: GameState): number {
  const slots = state.business.liveProduct?.featureSlots ?? 2;
  return 2500 + slots * 1800;
}

export function upgradeFeatureSlots(state: GameState): GameState {
  const live = state.business.liveProduct;
  if (!live) return state;
  const cost = getFeatureSlotUpgradeCost(state);
  if (state.player.money < cost) return state;
  return {
    ...state,
    player: { ...state.player, money: state.player.money - cost },
    business: {
      ...state.business,
      liveProduct: { ...live, featureSlots: live.featureSlots + 1 },
    },
    logs: [
      ...state.logs,
      {
        week: state.player.currentWeek,
        type: 'info',
        message: `Feature slot purchased: ${live.featureSlots} -> ${live.featureSlots + 1}`,
      },
    ],
  };
}

export function getAvailableFeatureTemplates(state: GameState): ProductFeatureTemplate[] {
  const live = state.business.liveProduct;
  if (!live) return [];
  return PRODUCT_FEATURE_TEMPLATES.filter(tpl => {
    if (tpl.compatibleProductTypes && !tpl.compatibleProductTypes.includes(live.productType)) return false;
    return true;
  });
}

