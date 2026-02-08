import { GameState, ISOStandard, ISOStage } from '../types';
import { getT } from '../../i18n';

const STAGE_ORDER: ISOStage[] = ['none', 'audit', 'implementation', 'internal_check', 'certification', 'maintenance'];
const STAGE_COST: Record<ISOStage, number> = {
  none: 0,
  audit: 3000,
  implementation: 8000,
  internal_check: 4000,
  certification: 6000,
  maintenance: 0,
};

const STAGE_WEEKS_REQUIRED: Record<ISOStage, number> = {
  none: 0,
  audit: 2,
  implementation: 4,
  internal_check: 2,
  certification: 3,
  maintenance: 999,
};

export function getNextStage(current: ISOStage): ISOStage | null {
  const idx = STAGE_ORDER.indexOf(current);
  if (idx < 0 || idx >= STAGE_ORDER.length - 1) return null;
  return STAGE_ORDER[idx + 1];
}

export function getStageCost(stage: ISOStage): number {
  return STAGE_COST[stage] || 0;
}

export function getStageLabel(stage: ISOStage): string {
  const t = getT();
  const labels: Record<ISOStage, string> = {
    none: t.notStarted,
    audit: t.audit,
    implementation: t.implementation,
    internal_check: t.internalCheck,
    certification: t.certification,
    maintenance: t.maintenance,
  };
  return labels[stage];
}

export function canStartISO(state: GameState, isoId: string): boolean {
  const iso = state.business.isoStandards.find(i => i.id === isoId);
  if (!iso) return false;
  if (iso.currentStage !== 'none') return false;
  const cost = getStageCost('audit');
  return state.player.money >= cost;
}

export function startISO(state: GameState, isoId: string): GameState {
  if (!canStartISO(state, isoId)) return state;

  const cost = getStageCost('audit');
  const newIsos = state.business.isoStandards.map(iso => {
    if (iso.id !== isoId) return iso;
    return { ...iso, currentStage: 'audit' as ISOStage, stageProgress: 0 };
  });

  return {
    ...state,
    player: { ...state.player, money: state.player.money - cost },
    business: { ...state.business, isoStandards: newIsos },
    logs: [
      ...state.logs,
      { week: state.player.currentWeek, message: getT().isoStartedMessage, type: 'info' },
    ],
  };
}

export function advanceISO(state: GameState, isoId: string): GameState {
  const iso = state.business.isoStandards.find(i => i.id === isoId);
  if (!iso || iso.currentStage === 'none' || iso.currentStage === 'maintenance') return state;

  const next = getNextStage(iso.currentStage);
  if (!next) return state;

  const cost = getStageCost(next);
  if (state.player.money < cost) {
    return {
      ...state,
      logs: [
        ...state.logs,
        { week: state.player.currentWeek, message: getT().isoNotEnoughMoney(getStageLabel(next)), type: 'warning' },
      ],
    };
  }

  const newIsos = state.business.isoStandards.map(i => {
    if (i.id !== isoId) return i;
    const isCertifying = next === 'maintenance';
    return {
      ...i,
      currentStage: next,
      stageProgress: 0,
      certified: isCertifying ? true : i.certified,
      turnsInMaintenance: isCertifying ? 0 : i.turnsInMaintenance,
    };
  });

  const label = getStageLabel(next);
  const isCertified = next === 'maintenance';

  return {
    ...state,
    player: { ...state.player, money: state.player.money - cost },
    business: { ...state.business, isoStandards: newIsos },
    logs: [
      ...state.logs,
      {
        week: state.player.currentWeek,
        message: isCertified
          ? getT().isoCertifiedMessage
          : getT().isoAdvancedMessage(label),
        type: isCertified ? 'success' : 'info',
      },
    ],
  };
}

export function tickISO(state: GameState): GameState {
  const hasQA = state.business.team.some(m => m.role === 'qa');
  const hasManager = state.business.team.some(m => m.role === 'manager');
  const progressPerTurn = 25 + (hasQA ? 10 : 0) + (hasManager ? 8 : 0);

  let newState = { ...state };
  const newLogs = [...state.logs];
  const newIsos = state.business.isoStandards.map(iso => {
    if (iso.currentStage === 'none') return iso;

    if (iso.currentStage === 'maintenance') {
      // Check for maintenance failure
      const failRoll = Math.random();
      if (failRoll < iso.failRisk) {
        newLogs.push({
          week: state.player.currentWeek,
          message: getT().isoMaintenanceIssue,
          type: 'warning',
        });
        return { ...iso, turnsInMaintenance: iso.turnsInMaintenance + 1 };
      }
      return { ...iso, turnsInMaintenance: iso.turnsInMaintenance + 1 };
    }

    // Progress current stage
    const newProgress = Math.min(100, iso.stageProgress + progressPerTurn);
    return { ...iso, stageProgress: newProgress };
  });

  return {
    ...newState,
    business: { ...newState.business, isoStandards: newIsos },
    logs: newLogs,
  };
}

export function canAdvanceISO(state: GameState, isoId: string): boolean {
  const iso = state.business.isoStandards.find(i => i.id === isoId);
  if (!iso) return false;
  if (iso.currentStage === 'none' || iso.currentStage === 'maintenance') return false;
  if (iso.stageProgress < 100) return false;
  const next = getNextStage(iso.currentStage);
  if (!next) return false;
  return state.player.money >= getStageCost(next);
}
