import { EMPLOYEE_LEVEL_OUTPUT_MULT, ProductionResourceBundle, ProductionResourceId, ProductionState, TeamMember, TeamRole } from './types';

export const PRODUCTION_RESOURCES: ProductionResourceId[] = ['code', 'design', 'ops', 'support'];

export const ROLE_WEEKLY_RESOURCE_BASE: Record<TeamRole, ProductionResourceBundle> = {
  developer: { code: 10, design: 1, ops: 1, support: 0.5 },
  manager: { code: 1.5, design: 2.5, ops: 3, support: 3 },
  qa: { code: 1, design: 0.5, ops: 2.5, support: 6 },
  security: { code: 1, design: 0.25, ops: 6.5, support: 1.5 },
  marketing: { code: 0.5, design: 5.5, ops: 0.75, support: 2 },
};

export function createEmptyResourceBundle(value = 0): ProductionResourceBundle {
  return { code: value, design: value, ops: value, support: value };
}

export function roundResourceBundle(bundle: ProductionResourceBundle): ProductionResourceBundle {
  return {
    code: Math.round(bundle.code),
    design: Math.round(bundle.design),
    ops: Math.round(bundle.ops),
    support: Math.round(bundle.support),
  };
}

export function addResourceBundles(a: ProductionResourceBundle, b: ProductionResourceBundle): ProductionResourceBundle {
  return {
    code: a.code + b.code,
    design: a.design + b.design,
    ops: a.ops + b.ops,
    support: a.support + b.support,
  };
}

export function subtractResourceBundles(a: ProductionResourceBundle, b: ProductionResourceBundle): ProductionResourceBundle {
  return {
    code: a.code - b.code,
    design: a.design - b.design,
    ops: a.ops - b.ops,
    support: a.support - b.support,
  };
}

export function scaleResourceBundle(bundle: ProductionResourceBundle, factor: number): ProductionResourceBundle {
  return {
    code: bundle.code * factor,
    design: bundle.design * factor,
    ops: bundle.ops * factor,
    support: bundle.support * factor,
  };
}

export function hasRequiredResources(
  inventory: ProductionResourceBundle,
  required: Partial<ProductionResourceBundle> | undefined,
): boolean {
  if (!required) return true;
  return PRODUCTION_RESOURCES.every((resource) => inventory[resource] >= (required[resource] ?? 0));
}

export function normalizeResourceRequirements(required: Partial<ProductionResourceBundle> | undefined): ProductionResourceBundle {
  return {
    code: Math.max(0, required?.code ?? 0),
    design: Math.max(0, required?.design ?? 0),
    ops: Math.max(0, required?.ops ?? 0),
    support: Math.max(0, required?.support ?? 0),
  };
}

export function getMemberProductionOutput(member: TeamMember): ProductionResourceBundle {
  const base = ROLE_WEEKLY_RESOURCE_BASE[member.role] ?? createEmptyResourceBundle();
  const levelMult = EMPLOYEE_LEVEL_OUTPUT_MULT[(member.level || 1) - 1] ?? 1;
  const experienceMult = 0.6 + (member.experience / 100) * 0.8;
  const moraleMult = 0.7 + (member.morale / 100) * 0.5;
  const burnoutMult = Math.max(0.25, 1 - member.burnout / 160);
  const talentMult = 0.8 + Math.max(0, member.talent) * 0.6;
  const totalMult = levelMult * experienceMult * moraleMult * burnoutMult * talentMult;
  return scaleResourceBundle(base, totalMult);
}

export function createInitialProductionState(): ProductionState {
  return {
    inventory: createEmptyResourceBundle(),
    queue: [],
    nextQueueSeq: 1,
    pendingConsumed: createEmptyResourceBundle(),
    lastWeek: {
      output: createEmptyResourceBundle(),
      delivered: createEmptyResourceBundle(),
      consumed: createEmptyResourceBundle(),
      idle: createEmptyResourceBundle(),
      completedQueueIds: [],
      blockedQueueIds: [],
    },
  };
}
