import { GameState, ProductLifecycle, LIFECYCLE_WEEKS, CompanyProduct } from '../types';
import { getT } from '../../i18n';
import { BALANCE } from '../config/balance';

const LIFECYCLE_ORDER: ProductLifecycle[] = ['prototype', 'beta', 'release', 'growth', 'maturity', 'decline'];

function nextLifecycleStage(current: ProductLifecycle): ProductLifecycle | null {
  const idx = LIFECYCLE_ORDER.indexOf(current);
  if (idx < 0 || idx >= LIFECYCLE_ORDER.length - 1) return null;
  return LIFECYCLE_ORDER[idx + 1];
}

// Auto-advance products through prototype → beta based on weeks.
// release → growth → maturity → decline are driven by quality/demand over time.
export function tickProducts(state: GameState): GameState {
  if (state.business.companyProducts.length === 0) return state;

  const t = getT();
  const devCount = state.business.team.filter(m => m.role === 'developer' && m.status === 'office').length;
  const qaCount = state.business.team.filter(m => m.role === 'qa' && m.status === 'office').length;
  const newLogs = [...state.logs];

  const newProducts = state.business.companyProducts.map(cp => {
    const updated = { ...cp, lifecycleWeeks: cp.lifecycleWeeks + 1 };

    // Quality improves each week ONLY if developers are working
    if (devCount > 0) {
      const devQualityGain = devCount * BALANCE.product.qualityPerDevPerWeek + qaCount * BALANCE.product.qualityPerQaPerWeek;
      updated.quality = Math.min(1, updated.quality + devQualityGain);
    }

    // Audience grows ONLY from marketers — no one knows about a new company
    const marketingCount = state.business.team.filter(m => m.role === 'marketing' && m.status === 'office').length;
    if (LIFECYCLE_ORDER.indexOf(cp.lifecycle) >= BALANCE.product.releaseStageIndex && marketingCount > 0) {
      const audienceGain = marketingCount * BALANCE.product.audiencePerMarketingPerWeek;
      updated.audience = Math.min(1, updated.audience + audienceGain);
    }

    // Prototype/beta advance ONLY with developers working
    const requiredWeeks = LIFECYCLE_WEEKS[cp.lifecycle];
    if (requiredWeeks > 0 && updated.lifecycleWeeks >= requiredWeeks) {
      // Prototype and beta require at least 1 developer to advance
      if ((cp.lifecycle === 'prototype' || cp.lifecycle === 'beta') && devCount === 0) {
        // Stalled — no devs, no progress
      } else {
        const next = nextLifecycleStage(cp.lifecycle);
        if (next) {
          updated.lifecycle = next;
          updated.lifecycleWeeks = 0;
          newLogs.push({
            week: state.player.currentWeek,
            message: t.productAdvancedMessage(cp.name, next),
            type: 'success',
          });
        }
      }
    }

    // Auto-advance later stages based on conditions
    if (
      cp.lifecycle === 'release'
      && updated.lifecycleWeeks >= BALANCE.product.releaseToGrowthWeeks
      && updated.quality >= BALANCE.product.releaseQualityThreshold
    ) {
      updated.lifecycle = 'growth';
      updated.lifecycleWeeks = 0;
      newLogs.push({
        week: state.player.currentWeek,
        message: t.productGrowthMessage(cp.name),
        type: 'success',
      });
    } else if (cp.lifecycle === 'growth' && updated.lifecycleWeeks >= BALANCE.product.growthToMaturityWeeks) {
      updated.lifecycle = 'maturity';
      updated.lifecycleWeeks = 0;
      newLogs.push({
        week: state.player.currentWeek,
        message: t.productMaturityMessage(cp.name),
        type: 'info',
      });
    } else if (cp.lifecycle === 'maturity' && updated.lifecycleWeeks >= BALANCE.product.maturityToDeclineWeeks) {
      updated.lifecycle = 'decline';
      updated.lifecycleWeeks = 0;
      newLogs.push({
        week: state.player.currentWeek,
        message: t.productDeclineMessage(cp.name),
        type: 'warning',
      });
    }

    // Quality decay in decline
    if (updated.lifecycle === 'decline') {
      updated.quality = Math.max(BALANCE.product.declineQualityFloor, updated.quality - BALANCE.product.declineQualityLossPerWeek);
      updated.audience = Math.max(BALANCE.product.declineAudienceFloor, updated.audience - BALANCE.product.declineAudienceLossPerWeek);
    }

    return updated;
  });

  return {
    ...state,
    business: { ...state.business, companyProducts: newProducts },
    logs: newLogs,
  };
}

// Create initial company product when game starts
export function createInitialProduct(productId: string, productName: string, monetizationId: string): CompanyProduct {
  return {
    id: `cp_${Date.now()}`,
    name: productName,
    type: 'saas',
    quality: 0.1,
    audience: 0,
    monetizationId,
    lifecycle: 'prototype',
    lifecycleWeeks: 0,
    revenue: 0,
  };
}
