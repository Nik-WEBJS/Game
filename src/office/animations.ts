import { TeamRole } from '@/game/types';
import { BurnoutVisualState } from './mappings';

// --- Animation state definitions ---

export type AnimationType =
  | 'typing'       // Developer: working at computer
  | 'walking'      // Manager: moving around office
  | 'inspecting'   // QA: checking screens
  | 'guarding'     // Security: standing watch
  | 'presenting'   // Marketing: phone/presentation
  | 'idle';

export const ROLE_ANIMATIONS: Record<TeamRole, AnimationType> = {
  developer: 'typing',
  manager: 'walking',
  qa: 'inspecting',
  security: 'guarding',
  marketing: 'presenting',
};

// --- Animation parameters ---

export interface AnimationParams {
  bobSpeed: number;      // vertical bob frequency
  bobAmount: number;     // vertical bob amplitude
  swaySpeed: number;     // horizontal sway frequency
  swayAmount: number;    // horizontal sway amplitude
  rotateSpeed: number;   // rotation speed (for walking)
  rotateAmount: number;  // rotation amplitude
  pauseChance: number;   // chance of pausing per cycle (0-1)
}

const BASE_PARAMS: Record<AnimationType, AnimationParams> = {
  typing: {
    bobSpeed: 3,
    bobAmount: 0.02,
    swaySpeed: 0,
    swayAmount: 0,
    rotateSpeed: 0,
    rotateAmount: 0,
    pauseChance: 0.1,
  },
  walking: {
    bobSpeed: 4,
    bobAmount: 0.06,
    swaySpeed: 2,
    swayAmount: 0.3,
    rotateSpeed: 0.5,
    rotateAmount: Math.PI * 0.5,
    pauseChance: 0.2,
  },
  inspecting: {
    bobSpeed: 2,
    bobAmount: 0.03,
    swaySpeed: 1.5,
    swayAmount: 0.1,
    rotateSpeed: 0.8,
    rotateAmount: Math.PI * 0.3,
    pauseChance: 0.15,
  },
  guarding: {
    bobSpeed: 1,
    bobAmount: 0.01,
    swaySpeed: 0,
    swayAmount: 0,
    rotateSpeed: 0.2,
    rotateAmount: Math.PI * 0.1,
    pauseChance: 0.05,
  },
  presenting: {
    bobSpeed: 2.5,
    bobAmount: 0.04,
    swaySpeed: 1,
    swayAmount: 0.15,
    rotateSpeed: 0.3,
    rotateAmount: Math.PI * 0.2,
    pauseChance: 0.1,
  },
  idle: {
    bobSpeed: 1.5,
    bobAmount: 0.015,
    swaySpeed: 0,
    swayAmount: 0,
    rotateSpeed: 0,
    rotateAmount: 0,
    pauseChance: 0,
  },
};

// --- Burnout modifiers ---

const BURNOUT_MODIFIERS: Record<BurnoutVisualState, { speedMul: number; bobMul: number; pauseMul: number }> = {
  normal: { speedMul: 1, bobMul: 1, pauseMul: 1 },
  slowed: { speedMul: 0.6, bobMul: 0.8, pauseMul: 1.5 },
  slouched: { speedMul: 0.3, bobMul: 1.3, pauseMul: 2.5 },
  removed: { speedMul: 0, bobMul: 0, pauseMul: 0 },
};

export function getAnimationParams(
  role: TeamRole,
  burnoutState: BurnoutVisualState,
  moraleSpeedFactor: number,
): AnimationParams {
  const anim = ROLE_ANIMATIONS[role];
  const base = BASE_PARAMS[anim];
  const mod = BURNOUT_MODIFIERS[burnoutState];

  const speed = mod.speedMul * moraleSpeedFactor;

  return {
    bobSpeed: base.bobSpeed * speed,
    bobAmount: base.bobAmount * mod.bobMul,
    swaySpeed: base.swaySpeed * speed,
    swayAmount: base.swayAmount * speed,
    rotateSpeed: base.rotateSpeed * speed,
    rotateAmount: base.rotateAmount,
    pauseChance: Math.min(1, base.pauseChance * mod.pauseMul),
  };
}
