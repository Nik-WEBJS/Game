import { GameState, TeamMember, TeamRole, MarketCandidate, OFFICE_LEVELS, EMPLOYEE_LEVEL_THRESHOLDS, EMPLOYEE_LEVEL_SALARY_MULT } from '../types';
import { generateTeamMemberName, ROLE_SALARIES } from '../data';
import { getT } from '../../i18n';
import { roleName } from '../../i18n/game-text';

let nextTeamId = 1;

export function createTeamMember(role: TeamRole): TeamMember {
  return {
    id: `team_${nextTeamId++}`,
    role,
    name: generateTeamMemberName(),
    salary: ROLE_SALARIES[role] || 2000,
    level: 1,
    experience: 20 + Math.floor(Math.random() * 30),
    burnout: 0,
    morale: 70 + Math.floor(Math.random() * 20),
    talent: 0.3 + Math.random() * 0.3,
    burnoutResistance: 0.2 + Math.random() * 0.3,
    trait: null,
    zoneId: null,
    deskId: null,
    status: 'office',
    freelanceTask: null,
    workProgress: 0,
    workCyclesCompleted: 0,
  };
}

export function hireFromMarket(state: GameState, candidateId: string): GameState {
  const candidate = state.business.employeeMarket.find(c => c.id === candidateId);
  if (!candidate) return state;
  if (state.player.money < candidate.hireCost) return state;
  const levelDef = OFFICE_LEVELS.find(l => l.level === state.business.office.level);
  if (levelDef && state.business.team.length >= levelDef.maxEmployees) return state;

  const member: TeamMember = {
    id: `team_${nextTeamId++}`,
    role: candidate.role,
    name: candidate.name,
    salary: candidate.salary,
    level: 1,
    experience: candidate.experience,
    burnout: 0,
    morale: 75,
    talent: candidate.talent,
    burnoutResistance: candidate.burnoutResistance,
    trait: candidate.trait,
    zoneId: null,
    deskId: null,
    status: 'office',
    freelanceTask: null,
    workProgress: 0,
    workCyclesCompleted: 0,
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
        message: getT().hiredMarketMessage(member.name, roleName(member.role, getT()), candidate.rarity, `$${candidate.hireCost.toLocaleString()}`),
        type: 'info' as const,
      },
    ],
  };
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
  // Clear previous desk assignment if any
  const member = state.business.team.find(m => m.id === memberId);
  const prevDeskId = member?.deskId ?? null;

  // Clear any other employee from the target desk
  let newTeam = state.business.team.map(m => {
    if (deskId && m.deskId === deskId && m.id !== memberId) return { ...m, deskId: null };
    return m;
  });
  // Assign the desk to this employee
  newTeam = newTeam.map(m =>
    m.id === memberId ? { ...m, deskId } : m
  );

  // Update furniture assignedEmployeeId
  let newFurniture = state.business.furniture.map(f => {
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
  return ROLE_SALARIES[role] * 2; // 2 months salary as hiring cost
}

export function canHire(state: GameState, role: TeamRole): boolean {
  const levelDef = OFFICE_LEVELS.find(l => l.level === state.business.office.level);
  if (levelDef && state.business.team.length >= levelDef.maxEmployees) return false;
  return state.player.money >= getHireCost(role);
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
  if (member.status === 'freelance') return state; // can't fire while on freelance

  // Clear desk assignment
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

export function tickTeam(state: GameState): GameState {
  const isoReduction = state.business.isoStandards.some(iso => iso.certified)
    ? 0.1 : 0;

  const newTeam = state.business.team.map(member => {
    // Skip freelancers — they are processed by freelance engine
    if (member.status === 'freelance') return member;

    // Experience grows slowly
    const expGain = 1 + (member.role === 'developer' ? 1 : 0);
    const newExp = Math.min(100, member.experience + expGain);

    // Burnout increases with workload, decreases with morale
    const workload = state.business.metrics.risk * 15;
    const recovery = member.morale * 0.05 + isoReduction * 10;
    const burnoutDelta = workload - recovery;
    const newBurnout = Math.max(0, Math.min(100, member.burnout + burnoutDelta));

    // Morale affected by profit and burnout
    const profitEffect = state.business.metrics.profit > 0 ? 2 : -3;
    const burnoutEffect = newBurnout > 60 ? -3 : newBurnout > 30 ? -1 : 1;
    const newMorale = Math.max(10, Math.min(100, member.morale + profitEffect + burnoutEffect));

    // Level up check
    let newLevel = member.level;
    for (let i = EMPLOYEE_LEVEL_THRESHOLDS.length - 1; i >= 0; i--) {
      if (newExp >= EMPLOYEE_LEVEL_THRESHOLDS[i]) {
        newLevel = i + 1;
        break;
      }
    }
    // Salary increases with level
    const baseSalary = ROLE_SALARIES[member.role] || 2000;
    const newSalary = Math.round(baseSalary * EMPLOYEE_LEVEL_SALARY_MULT[newLevel - 1]);

    return {
      ...member,
      level: newLevel,
      salary: newSalary,
      experience: newExp,
      burnout: Math.round(newBurnout),
      morale: Math.round(newMorale),
    };
  });

  // Check for auto-quit (burnout >= 95)
  const quitters = newTeam.filter(m => m.burnout >= 95);
  const remaining = newTeam.filter(m => m.burnout < 95);

  const newLogs = [...state.logs];
  for (const q of quitters) {
    newLogs.push({
      week: state.player.currentWeek,
      message: getT().quitBurnoutMessage(q.name, roleName(q.role, getT())),
      type: 'danger',
    });
  }

  return {
    ...state,
    business: { ...state.business, team: remaining },
    logs: newLogs,
  };
}
