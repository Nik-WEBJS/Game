import { GameState, ProductLifecycle, LIFECYCLE_WEEKS, CompanyProduct } from '../types';

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

  const devCount = state.business.team.filter(m => m.role === 'developer').length;
  const qaCount = state.business.team.filter(m => m.role === 'qa').length;
  const newLogs = [...state.logs];

  const newProducts = state.business.companyProducts.map(cp => {
    const updated = { ...cp, lifecycleWeeks: cp.lifecycleWeeks + 1 };

    // Quality improves each week based on dev team working on it
    const devQualityGain = devCount * 0.008 + qaCount * 0.005;
    updated.quality = Math.min(1, updated.quality + devQualityGain);

    // Audience grows slowly based on marketing team
    const marketingCount = state.business.team.filter(m => m.role === 'marketing').length;
    if (LIFECYCLE_ORDER.indexOf(cp.lifecycle) >= 2) { // release or later
      const audienceGain = marketingCount * 0.01 + 0.005;
      updated.audience = Math.min(1, updated.audience + audienceGain);
    }

    // Auto-advance early stages
    const requiredWeeks = LIFECYCLE_WEEKS[cp.lifecycle];
    if (requiredWeeks > 0 && updated.lifecycleWeeks >= requiredWeeks) {
      const next = nextLifecycleStage(cp.lifecycle);
      if (next) {
        updated.lifecycle = next;
        updated.lifecycleWeeks = 0;
        newLogs.push({
          week: state.player.currentWeek,
          message: `${cp.name} advanced to ${next} stage!`,
          type: 'success',
        });
      }
    }

    // Auto-advance later stages based on conditions
    if (cp.lifecycle === 'release' && updated.lifecycleWeeks >= 8 && updated.quality >= 0.5) {
      updated.lifecycle = 'growth';
      updated.lifecycleWeeks = 0;
      newLogs.push({
        week: state.player.currentWeek,
        message: `${cp.name} entered growth phase!`,
        type: 'success',
      });
    } else if (cp.lifecycle === 'growth' && updated.lifecycleWeeks >= 16) {
      updated.lifecycle = 'maturity';
      updated.lifecycleWeeks = 0;
      newLogs.push({
        week: state.player.currentWeek,
        message: `${cp.name} reached maturity.`,
        type: 'info',
      });
    } else if (cp.lifecycle === 'maturity' && updated.lifecycleWeeks >= 24) {
      updated.lifecycle = 'decline';
      updated.lifecycleWeeks = 0;
      newLogs.push({
        week: state.player.currentWeek,
        message: `${cp.name} is in decline. Consider pivoting or launching a new product.`,
        type: 'warning',
      });
    }

    // Quality decay in decline
    if (updated.lifecycle === 'decline') {
      updated.quality = Math.max(0.1, updated.quality - 0.005);
      updated.audience = Math.max(0, updated.audience - 0.008);
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
