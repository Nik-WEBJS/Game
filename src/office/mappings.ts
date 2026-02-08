import { TeamMember, ISOStandard, TeamRole } from '@/game/types';

// --- Employee visual state based on burnout ---

export type BurnoutVisualState = 'normal' | 'slowed' | 'slouched' | 'removed';

export function getBurnoutVisual(burnout: number): BurnoutVisualState {
  if (burnout >= 95) return 'removed';
  if (burnout >= 70) return 'slouched';
  if (burnout >= 40) return 'slowed';
  return 'normal';
}

// Animation speed multiplier based on morale (0-100)
export function getMoraleSpeedFactor(morale: number): number {
  return 0.4 + (morale / 100) * 0.6; // 0.4 at 0 morale, 1.0 at 100
}

// --- ISO visual state ---

export type ISOVisualState = 'absent' | 'in_progress' | 'certified' | 'problem';

export function getISOVisualState(isoStandards: ISOStandard[]): ISOVisualState {
  const iso = isoStandards[0];
  if (!iso || iso.currentStage === 'none') return 'absent';
  if (iso.certified) {
    if (iso.turnsInMaintenance > 0 && iso.stageProgress < 50) return 'problem';
    return 'certified';
  }
  return 'in_progress';
}

// --- Office scale based on team size ---

export function getOfficeScale(teamSize: number): number {
  if (teamSize <= 3) return 1;
  if (teamSize <= 6) return 1.3;
  if (teamSize <= 10) return 1.6;
  return 2.0;
}

// --- Zone activation based on team size ---

export function getActiveZones(teamSize: number): number {
  if (teamSize <= 2) return 1;
  if (teamSize <= 5) return 2;
  if (teamSize <= 8) return 3;
  return 4;
}

// --- Employee desk positions (isometric grid) ---

export function getEmployeePosition(index: number): [number, number, number] {
  const row = Math.floor(index / 4);
  const col = index % 4;
  const x = (col - 1.5) * 2.2;
  const z = (row - 0.5) * 2.5 + 1;
  return [x, 0, z];
}

// --- Role to color mapping ---

export const ROLE_COLORS: Record<TeamRole, string> = {
  developer: '#60a5fa',   // blue
  manager: '#f59e0b',     // amber
  qa: '#34d399',          // emerald
  security: '#ef4444',    // red
  marketing: '#a78bfa',   // purple
};

// --- Risk visual effects ---

export function getRiskVisualIntensity(risk: number): number {
  return Math.min(1, Math.max(0, risk));
}

// --- Profit glow ---

export function getProfitGlow(profit: number): { color: string; intensity: number } {
  if (profit > 5000) return { color: '#34d399', intensity: 0.5 };
  if (profit > 0) return { color: '#34d399', intensity: 0.2 };
  if (profit > -2000) return { color: '#f59e0b', intensity: 0.2 };
  return { color: '#ef4444', intensity: 0.4 };
}
