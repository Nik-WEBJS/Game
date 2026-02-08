import { GameState, TeamMember, TeamRole } from '../types';
import { generateTeamMemberName, ROLE_SALARIES } from '../data';

let nextTeamId = 1;

export function createTeamMember(role: TeamRole): TeamMember {
  return {
    id: `team_${nextTeamId++}`,
    role,
    name: generateTeamMemberName(),
    salary: ROLE_SALARIES[role] || 3000,
    experience: 20 + Math.floor(Math.random() * 30),
    burnout: 0,
    morale: 70 + Math.floor(Math.random() * 20),
  };
}

export function getHireCost(role: TeamRole): number {
  return ROLE_SALARIES[role] * 2; // 2 months salary as hiring cost
}

export function canHire(state: GameState, role: TeamRole): boolean {
  return state.player.money >= getHireCost(role);
}

export function hireMember(state: GameState, role: TeamRole): GameState {
  if (!canHire(state, role)) return state;

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
        message: `Hired ${member.name} as ${role}. Cost: $${cost.toLocaleString()}`,
        type: 'info',
      },
    ],
  };
}

export function fireMember(state: GameState, memberId: string): GameState {
  const member = state.business.team.find(m => m.id === memberId);
  if (!member) return state;

  return {
    ...state,
    business: {
      ...state.business,
      team: state.business.team.filter(m => m.id !== memberId),
    },
    logs: [
      ...state.logs,
      {
        week: state.player.currentWeek,
        message: `${member.name} (${member.role}) left the company.`,
        type: 'warning',
      },
    ],
  };
}

export function tickTeam(state: GameState): GameState {
  const isoReduction = state.business.isoStandards.some(iso => iso.certified)
    ? 0.1 : 0;

  const newTeam = state.business.team.map(member => {
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

    return {
      ...member,
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
      message: `💀 ${q.name} (${q.role}) quit due to extreme burnout!`,
      type: 'danger',
    });
  }

  return {
    ...state,
    business: { ...state.business, team: remaining },
    logs: newLogs,
  };
}
