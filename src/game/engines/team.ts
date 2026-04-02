import { GameState, TeamMember, TeamRole, OFFICE_LEVELS, EMPLOYEE_LEVEL_THRESHOLDS, EMPLOYEE_LEVEL_SALARY_MULT } from '../types';
import { generateTeamMemberName, ROLE_SALARIES } from '../data';
import { getT } from '../../i18n';
import { roleName } from '../../i18n/game-text';
import { BALANCE } from '../config/balance';

let nextTeamId = 1;

function clamp(min: number, max: number, value: number): number {
  return Math.max(min, Math.min(max, value));
}

function getBaseCompTarget(role: TeamRole, level: number, talent: number, reputation: number): number {
  const baseSalary = ROLE_SALARIES[role] || 2000;
  const levelMul = EMPLOYEE_LEVEL_SALARY_MULT[Math.max(0, Math.min(EMPLOYEE_LEVEL_SALARY_MULT.length - 1, level - 1))] ?? 1;
  const talentMul = 1 + talent * 0.24;
  const reputationMul = 1 + Math.max(0, reputation - 35) / 500;
  return Math.round(baseSalary * levelMul * talentMul * reputationMul);
}

function getBaseWorkplaceExpectation(level: number, talent: number, reputation: number): number {
  const raw = 34 + level * 6 + talent * 22 + Math.max(0, reputation - 45) * 0.16;
  return Math.round(clamp(28, 96, raw));
}

function createInitialRetentionProfile(role: TeamRole, level: number, talent: number, reputation: number): {
  salaryTarget: number;
  workplaceExpectation: number;
} {
  return {
    salaryTarget: getBaseCompTarget(role, level, talent, reputation),
    workplaceExpectation: getBaseWorkplaceExpectation(level, talent, reputation),
  };
}

export function getOfficeEnvironmentScore(state: GameState): number {
  const cfg = BALANCE.hr.officeEnvironment;
  const levelIdx = Math.max(0, Math.min(cfg.baseByOfficeLevel.length - 1, state.business.office.level - 1));
  const base = cfg.baseByOfficeLevel[levelIdx];
  const team = state.business.team;
  const avgMorale = team.length > 0
    ? team.reduce((sum, member) => sum + member.morale, 0) / team.length
    : 62;
  const avgBurnout = team.length > 0
    ? team.reduce((sum, member) => sum + member.burnout, 0) / team.length
    : 18;
  const furnitureMorale = state.business.furniture.reduce((sum, item) => sum + (item.effects.moraleMod ?? 0), 0);
  const furnitureBurnoutRelief = state.business.furniture.reduce((sum, item) => {
    const burnoutMod = item.effects.burnoutMod ?? 0;
    return sum + (burnoutMod < 0 ? -burnoutMod : 0);
  }, 0);

  const score = base
    + (avgMorale - 50) * cfg.moraleScale
    + (35 - avgBurnout) * cfg.burnoutReliefScale
    + furnitureMorale * cfg.furnitureMoraleScale
    + furnitureBurnoutRelief * cfg.furnitureBurnoutScale;

  return Math.round(clamp(20, 100, score));
}

export function createTeamMember(role: TeamRole): TeamMember {
  const level = 1;
  const talent = 0.3 + Math.random() * 0.3;
  const salary = ROLE_SALARIES[role] || 2000;
  const profile = createInitialRetentionProfile(role, level, talent, 15);
  return {
    id: `team_${nextTeamId++}`,
    role,
    name: generateTeamMemberName(),
    salary,
    level,
    experience: 20 + Math.floor(Math.random() * 30),
    burnout: 0,
    morale: 70 + Math.floor(Math.random() * 20),
    talent,
    burnoutResistance: 0.2 + Math.random() * 0.3,
    trait: null,
    zoneId: null,
    deskId: null,
    status: 'office',
    freelanceTask: null,
    workProgress: 0,
    workCyclesCompleted: 0,
    salaryTarget: profile.salaryTarget,
    workplaceExpectation: profile.workplaceExpectation,
    retentionRisk: 0,
    pendingCounterOffer: null,
  };
}

export function evaluateCandidateOffer(
  state: GameState,
  candidateId: string,
  salaryOffer: number,
): {
  ok: boolean;
  reason?: string;
  chance: number;
  salaryMin: number;
  salaryIdeal: number;
  officeScore: number;
} {
  const candidate = state.business.employeeMarket.find(c => c.id === candidateId);
  if (!candidate) {
    return { ok: false, reason: 'candidate_not_found', chance: 0, salaryMin: 0, salaryIdeal: 0, officeScore: 0 };
  }
  const levelDef = OFFICE_LEVELS.find(l => l.level === state.business.office.level);
  if (levelDef && state.business.team.length >= levelDef.maxEmployees) {
    return {
      ok: false,
      reason: 'office_full',
      chance: 0,
      salaryMin: candidate.salaryMin ?? Math.round(candidate.salary * 0.9),
      salaryIdeal: candidate.salaryIdeal ?? candidate.salary,
      officeScore: getOfficeEnvironmentScore(state),
    };
  }

  const salaryMin = Math.round(candidate.salaryMin ?? Math.round(candidate.salary * 0.9));
  const salaryIdeal = Math.round(Math.max(salaryMin, candidate.salaryIdeal ?? candidate.salary));
  const officeScore = getOfficeEnvironmentScore(state);
  if (salaryOffer < salaryMin) {
    return { ok: false, reason: 'salary_below_min', chance: 0, salaryMin, salaryIdeal, officeScore };
  }

  const cfg = BALANCE.hr.recruiting;
  const negotiationFlex = clamp(0.2, 1, candidate.negotiationFlex ?? 0.6);
  const salaryPos = clamp(0, 1.25, (salaryOffer - salaryMin) / Math.max(1, salaryIdeal - salaryMin));
  const repScore = state.player.reputation / 100;
  const officeNeed = clamp(0, 100, candidate.workplaceRequirement ?? 55);
  const officeScoreNorm = clamp(0, 1, officeScore / 100);
  const officeNeedNorm = clamp(0, 1, officeNeed / 100);
  const officeFactor = officeScoreNorm - officeNeedNorm;

  const rawChance = cfg.baseAcceptanceChance
    + salaryPos * cfg.salaryScale
    + repScore * cfg.reputationScale
    + officeFactor * cfg.officeScale
    - (1 - negotiationFlex) * cfg.difficultyPenaltyScale;
  const chance = clamp(cfg.minAcceptanceChance, cfg.maxAcceptanceChance, rawChance);
  return { ok: true, chance, salaryMin, salaryIdeal, officeScore };
}

export function makeCandidateOffer(state: GameState, candidateId: string, salaryOffer: number): GameState {
  const candidate = state.business.employeeMarket.find(c => c.id === candidateId);
  if (!candidate) return state;

  const roundedOffer = Math.max(1, Math.round(salaryOffer));
  const check = evaluateCandidateOffer(state, candidateId, roundedOffer);
  if (!check.ok) {
    if (check.reason === 'salary_below_min') {
      return {
        ...state,
        logs: [
          ...state.logs,
          {
            week: state.player.currentWeek,
            type: 'warning',
            message: `Offer rejected instantly: ${candidate.name} expects at least $${check.salaryMin.toLocaleString()}/week.`,
          },
        ],
      };
    }
    return state;
  }

  const accepted = Math.random() <= check.chance;
  if (accepted) {
    const profile = createInitialRetentionProfile(candidate.role, 1, candidate.talent, state.player.reputation);
    const member: TeamMember = {
      id: `team_${nextTeamId++}`,
      role: candidate.role,
      name: candidate.name,
      salary: roundedOffer,
      level: 1,
      experience: candidate.experience,
      burnout: 0,
      morale: 76,
      talent: candidate.talent,
      burnoutResistance: candidate.burnoutResistance,
      trait: candidate.trait,
      zoneId: null,
      deskId: null,
      status: 'office',
      freelanceTask: null,
      workProgress: 0,
      workCyclesCompleted: 0,
      salaryTarget: Math.max(profile.salaryTarget, check.salaryIdeal),
      workplaceExpectation: Math.max(profile.workplaceExpectation, candidate.workplaceRequirement ?? profile.workplaceExpectation),
      retentionRisk: 0,
      pendingCounterOffer: null,
    };
    return {
      ...state,
      player: { ...state.player, money: state.player.money - candidate.hireCost },
      business: {
        ...state.business,
        team: [...state.business.team, member],
        employeeMarket: state.business.employeeMarket.filter(c => c.id !== candidateId),
      },
      logs: [
        ...state.logs,
        {
          week: state.player.currentWeek,
          message: `Offer accepted: ${candidate.name} joined as ${roleName(member.role, getT())} for $${roundedOffer.toLocaleString()}/week (close chance ${(check.chance * 100).toFixed(0)}%).`,
          type: 'success',
        },
      ],
    };
  }

  const removeAfterReject = Math.random() < BALANCE.hr.recruiting.rejectionRemovesCandidateChance;
  return {
    ...state,
    business: {
      ...state.business,
      employeeMarket: removeAfterReject
        ? state.business.employeeMarket.filter(c => c.id !== candidateId)
        : state.business.employeeMarket,
    },
    logs: [
      ...state.logs,
      {
        week: state.player.currentWeek,
        type: 'warning',
        message: `Offer declined: ${candidate.name} rejected $${roundedOffer.toLocaleString()}/week (${(check.chance * 100).toFixed(0)}% expected chance).`,
      },
    ],
  };
}

export function hireFromMarket(state: GameState, candidateId: string): GameState {
  const candidate = state.business.employeeMarket.find(c => c.id === candidateId);
  if (!candidate) return state;
  const defaultOffer = Math.round(candidate.salaryIdeal ?? candidate.salary);
  return makeCandidateOffer(state, candidateId, defaultOffer);
}

export function assignZone(state: GameState, memberId: string, zoneId: string | null): GameState {
  return {
    ...state,
    business: {
      ...state.business,
      team: state.business.team.map(m =>
        m.id === memberId ? { ...m, zoneId: zoneId as TeamMember['zoneId'] } : m
      ),
    },
  };
}

export function assignDesk(state: GameState, memberId: string, deskId: string | null): GameState {
  const member = state.business.team.find(m => m.id === memberId);
  const prevDeskId = member?.deskId ?? null;

  let newTeam = state.business.team.map(m => {
    if (deskId && m.deskId === deskId && m.id !== memberId) return { ...m, deskId: null };
    return m;
  });
  newTeam = newTeam.map(m =>
    m.id === memberId ? { ...m, deskId } : m
  );

  const newFurniture = state.business.furniture.map(f => {
    if (f.id === prevDeskId) return { ...f, assignedEmployeeId: null };
    if (f.id === deskId) return { ...f, assignedEmployeeId: memberId };
    return f;
  });

  return {
    ...state,
    business: { ...state.business, team: newTeam, furniture: newFurniture },
  };
}

export function getHireCost(role: TeamRole): number {
  return ROLE_SALARIES[role] * 2;
}

export function canHire(state: GameState, _role: TeamRole): boolean {
  void _role;
  const levelDef = OFFICE_LEVELS.find(l => l.level === state.business.office.level);
  if (levelDef && state.business.team.length >= levelDef.maxEmployees) return false;
  return true;
}

export function hireMember(state: GameState, role: TeamRole): GameState {
  if (!canHire(state, role)) return state;
  const levelDef = OFFICE_LEVELS.find(l => l.level === state.business.office.level);
  if (levelDef && state.business.team.length >= levelDef.maxEmployees) return state;

  const member = createTeamMember(role);
  const cost = getHireCost(role);

  return {
    ...state,
    player: { ...state.player, money: state.player.money - cost },
    business: {
      ...state.business,
      team: [...state.business.team, member],
    },
    logs: [
      ...state.logs,
      {
        week: state.player.currentWeek,
        message: getT().hiredMessage(member.name, roleName(role, getT()), `$${cost.toLocaleString()}`),
        type: 'info',
      },
    ],
  };
}

export function fireMember(state: GameState, memberId: string): GameState {
  const member = state.business.team.find(m => m.id === memberId);
  if (!member) return state;
  if (member.status === 'freelance') return state;

  const newFurniture = member.deskId
    ? state.business.furniture.map(f => f.id === member.deskId ? { ...f, assignedEmployeeId: null } : f)
    : state.business.furniture;

  return {
    ...state,
    business: {
      ...state.business,
      team: state.business.team.filter(m => m.id !== memberId),
      furniture: newFurniture,
    },
    logs: [
      ...state.logs,
      {
        week: state.player.currentWeek,
        message: getT().firedMessage(member.name, roleName(member.role, getT())),
        type: 'warning',
      },
    ],
  };
}

export function respondToCounterOffer(state: GameState, memberId: string, accept: boolean): GameState {
  const member = state.business.team.find(m => m.id === memberId);
  if (!member || !member.pendingCounterOffer) return state;
  const offer = member.pendingCounterOffer;
  const cfg = BALANCE.hr.retention;

  if (accept) {
    return {
      ...state,
      business: {
        ...state.business,
        team: state.business.team.map(m => (
          m.id === memberId
            ? {
              ...m,
              salary: offer.requestedSalary,
              salaryTarget: Math.max(m.salaryTarget, offer.requestedSalary),
              morale: Math.round(clamp(10, 100, m.morale + cfg.acceptMoraleBoost)),
              retentionRisk: Math.max(0, m.retentionRisk * 0.45),
              pendingCounterOffer: null,
            }
            : m
        )),
      },
      logs: [
        ...state.logs,
        {
          week: state.player.currentWeek,
          type: 'success',
          message: `Counter-offer accepted: ${member.name} stays for $${offer.requestedSalary.toLocaleString()}/week.`,
        },
      ],
    };
  }

  const newFurniture = member.deskId
    ? state.business.furniture.map(f => f.id === member.deskId ? { ...f, assignedEmployeeId: null } : f)
    : state.business.furniture;

  return {
    ...state,
    player: {
      ...state.player,
      reputation: Math.round(clamp(0, 100, state.player.reputation - cfg.repPenaltyOnDecline)),
    },
    business: {
      ...state.business,
      team: state.business.team.filter(m => m.id !== memberId),
      furniture: newFurniture,
    },
    logs: [
      ...state.logs,
      {
        week: state.player.currentWeek,
        type: 'warning',
        message: `Counter-offer declined: ${member.name} left the company.`,
      },
    ],
  };
}

export function tickTeam(state: GameState): GameState {
  const isoReduction = state.business.isoStandards.some(iso => iso.certified) ? 0.1 : 0;
  const officeScore = getOfficeEnvironmentScore(state);
  const retentionCfg = BALANCE.hr.retention;
  const quitByCounterExpiry = new Set<string>();
  const newCounterOffers: Array<{ memberId: string; name: string; requestedSalary: number; expiresWeek: number }> = [];

  const newTeam = state.business.team.map(member => {
    if (member.pendingCounterOffer && state.player.currentWeek >= member.pendingCounterOffer.expiresWeek) {
      quitByCounterExpiry.add(member.id);
      return member;
    }
    if (member.status === 'freelance') return member;

    const levelPenalty = 1 / (1 + (member.level - 1) * BALANCE.team.levelPenaltyPerLevel);
    const expGain = (
      BALANCE.team.baseExperienceGainPerWeek
      + (member.role === 'developer' ? BALANCE.team.developerExperienceBonusPerWeek : 0)
    ) * levelPenalty;
    const newExp = Math.min(100, member.experience + expGain);

    const teamSize = state.business.team.filter(m => m.status === 'office').length;
    const teamSizeStress = Math.max(
      0,
      (teamSize - BALANCE.team.teamSizeStressThreshold) * BALANCE.team.teamSizeStressPerMember,
    );
    const levelStress = (member.level - 1) * BALANCE.team.levelStressPerLevel;
    const resistanceMod = 1 - (member.burnoutResistance ?? 0.3);
    const workload = (state.business.metrics.risk * BALANCE.team.riskLoadMultiplier + teamSizeStress + levelStress) * resistanceMod;
    const recovery = member.morale * BALANCE.team.moraleRecoveryFactor + isoReduction * BALANCE.team.isoRecoveryMultiplier;
    const burnoutDelta = workload - recovery;
    const newBurnout = Math.max(0, Math.min(100, member.burnout + burnoutDelta));

    const profitEffect = state.business.metrics.profit > 0
      ? BALANCE.team.moraleProfitBonus
      : -BALANCE.team.moraleLossBaseOnNegativeProfit - member.level * BALANCE.team.moraleLossPerLevelOnNegativeProfit;
    const burnoutEffect = newBurnout > BALANCE.team.burnoutEffectHighThreshold
      ? BALANCE.team.burnoutEffectHighPenalty
      : newBurnout > BALANCE.team.burnoutEffectMidThreshold
        ? BALANCE.team.burnoutEffectMidPenalty
        : newBurnout > BALANCE.team.burnoutEffectLowThreshold
          ? 0
          : BALANCE.team.burnoutEffectLowBonus;
    let newMorale = Math.max(10, Math.min(100, member.morale + profitEffect + burnoutEffect));

    let newLevel = member.level;
    for (let i = EMPLOYEE_LEVEL_THRESHOLDS.length - 1; i >= 0; i--) {
      if (newExp >= EMPLOYEE_LEVEL_THRESHOLDS[i]) {
        newLevel = i + 1;
        break;
      }
    }

    const baseSalary = ROLE_SALARIES[member.role] || 2000;
    const levelSalaryFloor = Math.round(baseSalary * EMPLOYEE_LEVEL_SALARY_MULT[newLevel - 1]);
    const newSalary = Math.round(Math.max(member.salary, levelSalaryFloor));
    const nextSalaryTarget = Math.max(
      member.salaryTarget ?? newSalary,
      getBaseCompTarget(member.role, newLevel, member.talent, state.player.reputation),
    );
    const nextWorkplaceExpectation = Math.round(Math.max(
      member.workplaceExpectation ?? 45,
      getBaseWorkplaceExpectation(newLevel, member.talent, state.player.reputation),
    ));

    const salaryGap = Math.max(0, (nextSalaryTarget - newSalary) / Math.max(1, nextSalaryTarget));
    const workplaceGap = Math.max(0, (nextWorkplaceExpectation - officeScore) / 100);
    const moraleRisk = Math.max(0, (retentionCfg.lowMoraleThreshold - newMorale) / Math.max(1, retentionCfg.lowMoraleThreshold));
    const burnoutRisk = Math.max(0, (newBurnout - retentionCfg.highBurnoutThreshold) / Math.max(1, 100 - retentionCfg.highBurnoutThreshold));

    const retentionRisk = clamp(
      0,
      1,
      salaryGap * retentionCfg.salaryGapScale
      + workplaceGap * retentionCfg.workplaceGapScale
      + moraleRisk * retentionCfg.moraleScale
      + burnoutRisk * retentionCfg.burnoutScale,
    );

    let pendingCounterOffer = member.pendingCounterOffer;
    if (
      !pendingCounterOffer
      && retentionRisk >= retentionCfg.riskThresholdForCounterOffer
      && Math.random() < retentionRisk * retentionCfg.counterOfferChanceScale
    ) {
      const raiseMul = 1 + retentionCfg.counterOfferBaseRaise + retentionRisk * retentionCfg.counterOfferRiskRaiseScale;
      const requestedSalary = Math.round(Math.max(nextSalaryTarget, newSalary * raiseMul));
      pendingCounterOffer = {
        requestedSalary,
        expiresWeek: state.player.currentWeek + retentionCfg.counterOfferDurationWeeks,
      };
      newCounterOffers.push({
        memberId: member.id,
        name: member.name,
        requestedSalary,
        expiresWeek: pendingCounterOffer.expiresWeek,
      });
      newMorale = Math.max(10, Math.round(newMorale - retentionCfg.declineMoralePenalty * 0.35));
    }

    return {
      ...member,
      level: newLevel,
      salary: newSalary,
      experience: newExp,
      burnout: Math.round(newBurnout),
      morale: Math.round(newMorale),
      salaryTarget: Math.round(nextSalaryTarget),
      workplaceExpectation: nextWorkplaceExpectation,
      retentionRisk: Math.round(retentionRisk * 1000) / 1000,
      pendingCounterOffer,
    };
  });

  const burnoutQuitters = newTeam.filter(m => m.burnout >= BALANCE.team.autoQuitBurnoutThreshold);
  const quitterIds = new Set<string>([
    ...burnoutQuitters.map(m => m.id),
    ...Array.from(quitByCounterExpiry),
  ]);
  const remaining = newTeam.filter(m => !quitterIds.has(m.id));
  const remainingFurniture = state.business.furniture.map((item) => (
    item.assignedEmployeeId && quitterIds.has(item.assignedEmployeeId)
      ? { ...item, assignedEmployeeId: null }
      : item
  ));

  const newLogs = [...state.logs];
  for (const offer of newCounterOffers) {
    newLogs.push({
      week: state.player.currentWeek,
      type: 'warning',
      message: `Retention alert: ${offer.name} requests $${offer.requestedSalary.toLocaleString()}/week by W${offer.expiresWeek}.`,
    });
  }
  for (const quitter of burnoutQuitters) {
    newLogs.push({
      week: state.player.currentWeek,
      message: getT().quitBurnoutMessage(quitter.name, roleName(quitter.role, getT())),
      type: 'danger',
    });
  }
  for (const quitter of newTeam.filter(member => quitByCounterExpiry.has(member.id))) {
    newLogs.push({
      week: state.player.currentWeek,
      type: 'danger',
      message: `Employee left: ${quitter.name} walked away after unresolved counter-offer.`,
    });
  }

  return {
    ...state,
    business: { ...state.business, team: remaining, furniture: remainingFurniture },
    logs: newLogs,
  };
}
