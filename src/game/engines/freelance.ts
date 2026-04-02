import { GameState, TeamMember, TeamRole, FreelanceTask, FreelanceTaskType, EMPLOYEE_LEVEL_OUTPUT_MULT } from '../types';
import {
  FREELANCE_ROLE_SPEED,
  FREELANCE_BURNOUT_PER_WEEK,
  FREELANCE_QUALITY_BOOST_PER_WEEK,
  BASE_CONTRACT_VALUE,
  FREELANCE_OUTSOURCING_ROLE_MULT,
  FREELANCE_DURATIONS,
} from '../data';
import { getT } from '../../i18n';
import { roleName } from '../../i18n/game-text';

// --- Helpers ---

function lerp(a: number, b: number, t: number): number {
  return a + (b - a) * Math.max(0, Math.min(1, t));
}

function getBurnoutPenalty(burnout: number): number {
  if (burnout < 50) return 1;
  if (burnout < 75) return 0.85;
  return 0.65;
}

function getMoraleMult(morale: number): number {
  return lerp(0.7, 1.15, morale / 100);
}

// --- Contract reward calculation ---

export function calculateOutsourcingReward(member: TeamMember): number {
  const levelMult = EMPLOYEE_LEVEL_OUTPUT_MULT[(member.level || 1) - 1] ?? 1;
  const roleMult = FREELANCE_OUTSOURCING_ROLE_MULT[member.role] ?? 1;
  return Math.round(BASE_CONTRACT_VALUE * roleMult * levelMult * (1 + member.talent * 0.5));
}

// --- Duration calculation ---

export function getFreelanceDuration(type: FreelanceTaskType): number {
  const range = FREELANCE_DURATIONS[type];
  return range.min + Math.floor(Math.random() * (range.max - range.min + 1));
}

// --- Create a freelance task ---

export function createFreelanceTask(
  member: TeamMember,
  type: FreelanceTaskType,
  currentWeek: number,
  targetProductId?: string,
): FreelanceTask {
  const duration = getFreelanceDuration(type);
  const reward = type === 'outsourcing' ? calculateOutsourcingReward(member) : 0;

  return {
    id: `fl_${Date.now()}_${Math.random().toString(36).slice(2, 5)}`,
    type,
    targetProductId: type === 'internal_help' ? targetProductId : undefined,
    durationWeeks: duration,
    progress: 0,
    rewardMoney: reward,
    qualityBoost: type === 'internal_help' ? FREELANCE_QUALITY_BOOST_PER_WEEK : undefined,
    startedAtWeek: currentWeek,
  };
}

// --- Anti-exploit checks ---

export function canSendToFreelance(state: GameState, memberId: string): { ok: boolean; reason?: string } {
  const member = state.business.team.find(m => m.id === memberId);
  if (!member) return { ok: false, reason: 'notFound' };
  if (member.status === 'freelance') return { ok: false, reason: 'alreadyFreelance' };
  if (member.pendingCounterOffer) return { ok: false, reason: 'pendingCounterOffer' };

  // Can't send last office employee
  const officeCount = state.business.team.filter(m => m.status === 'office').length;
  if (officeCount <= 1) return { ok: false, reason: 'lastEmployee' };

  // Can't send if burnout >= 85
  if (member.burnout >= 85) return { ok: false, reason: 'tooMuchBurnout' };

  // Can't send during crisis event
  const hasCrisis = state.activeEvents.some(e => e.type === 'crisis');
  if (hasCrisis) return { ok: false, reason: 'crisisActive' };

  return { ok: true };
}

// --- Send employee to freelance ---

export function sendToFreelance(
  state: GameState,
  memberId: string,
  taskType: FreelanceTaskType,
  targetProductId?: string,
): GameState {
  const check = canSendToFreelance(state, memberId);
  if (!check.ok) return state;

  const member = state.business.team.find(m => m.id === memberId)!;
  const task = createFreelanceTask(member, taskType, state.player.currentWeek, targetProductId);
  const t = getT();

  const logMsg = taskType === 'outsourcing'
    ? t.freelanceSentOutsourcing(member.name, roleName(member.role, t), `$${task.rewardMoney.toLocaleString()}`, task.durationWeeks)
    : t.freelanceSentInternal(member.name, roleName(member.role, t), task.durationWeeks);

  return {
    ...state,
    business: {
      ...state.business,
      team: state.business.team.map(m =>
        m.id === memberId
          ? { ...m, status: 'freelance' as const, freelanceTask: task, pendingCounterOffer: null }
          : m
      ),
    },
    logs: [...state.logs, { week: state.player.currentWeek, message: logMsg, type: 'info' as const }],
  };
}

// --- Weekly tick ---

export function tickFreelance(state: GameState): GameState {
  const t = getT();
  const newLogs = [...state.logs];
  let moneyDelta = 0;
  let productUpdates: Record<string, { qualityDelta: number; lifecycleDelta: number }> = {};

  const newTeam = state.business.team.map(member => {
    if (member.status !== 'freelance' || !member.freelanceTask) return member;

    const task = member.freelanceTask;
    const roleSpeed = FREELANCE_ROLE_SPEED[member.role]?.[task.type] ?? 1;
    const levelMult = EMPLOYEE_LEVEL_OUTPUT_MULT[(member.level || 1) - 1] ?? 1;
    const moraleMult = getMoraleMult(member.morale);
    const burnoutPen = getBurnoutPenalty(member.burnout);
    const baseSpeed = 1 / task.durationWeeks;

    const weeklyProgress = baseSpeed * roleSpeed * levelMult * (1 + member.talent * 0.3) * moraleMult * burnoutPen;
    const newProgress = Math.min(1, task.progress + weeklyProgress);

    // Burnout increases while freelancing
    const burnoutGain = FREELANCE_BURNOUT_PER_WEEK.min +
      Math.random() * (FREELANCE_BURNOUT_PER_WEEK.max - FREELANCE_BURNOUT_PER_WEEK.min);
    const newBurnout = Math.min(100, member.burnout + burnoutGain * (1 - member.burnoutResistance));

    // Morale slowly decreases while freelancing
    const newMorale = Math.max(10, member.morale - 1);

    // Internal help: apply quality boost each week
    if (task.type === 'internal_help' && task.targetProductId) {
      const qBoost = (task.qualityBoost ?? FREELANCE_QUALITY_BOOST_PER_WEEK) * roleSpeed * levelMult;
      const existing = productUpdates[task.targetProductId] ?? { qualityDelta: 0, lifecycleDelta: 0 };
      existing.qualityDelta += qBoost;
      existing.lifecycleDelta += qBoost * 0.5;
      productUpdates[task.targetProductId] = existing;
    }

    // Check completion
    if (newProgress >= 1) {
      if (task.type === 'outsourcing') {
        moneyDelta += task.rewardMoney;
        newLogs.push({
          week: state.player.currentWeek,
          message: t.freelanceCompletedOutsourcing(member.name, `$${task.rewardMoney.toLocaleString()}`),
          type: 'success',
        });
      } else {
        newLogs.push({
          week: state.player.currentWeek,
          message: t.freelanceCompletedInternal(member.name),
          type: 'success',
        });
      }

      const expGain = task.type === 'outsourcing' ? 5 : 3;
      const moralePenalty = task.type === 'outsourcing' ? 10 : 5;

      return {
        ...member,
        status: 'office' as const,
        freelanceTask: null,
        experience: Math.min(100, member.experience + expGain),
        morale: Math.max(10, newMorale - moralePenalty),
        burnout: Math.round(newBurnout),
      };
    }

    return {
      ...member,
      burnout: Math.round(newBurnout),
      morale: Math.round(newMorale),
      freelanceTask: { ...task, progress: newProgress },
    };
  });

  // Apply product quality/lifecycle boosts from internal_help
  const newProducts = state.business.companyProducts.map(p => {
    const update = productUpdates[p.id];
    if (!update) return p;
    return {
      ...p,
      quality: Math.min(1, p.quality + update.qualityDelta),
    };
  });

  return {
    ...state,
    player: { ...state.player, money: state.player.money + moneyDelta },
    business: { ...state.business, team: newTeam, companyProducts: newProducts },
    logs: newLogs,
  };
}
