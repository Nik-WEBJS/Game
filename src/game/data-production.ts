import { EMPLOYEE_LEVEL_OUTPUT_MULT, ProductionResourceBundle, ProductionResourceId, ProductionState, TeamMember, TeamRole } from './types';
import { BALANCE } from './config/balance';

export const PRODUCTION_RESOURCES: ProductionResourceId[] = ['code', 'design', 'ops', 'support'];

export const ROLE_WEEKLY_RESOURCE_BASE: Record<TeamRole, ProductionResourceBundle> = BALANCE.production.roleBaseOutput;

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
  const model = BALANCE.production.outputModel;
  const levelMult = EMPLOYEE_LEVEL_OUTPUT_MULT[(member.level || 1) - 1] ?? 1;
  const experienceMult = model.experienceBase + (member.experience / 100) * model.experienceRange;
  const moraleMult = model.moraleBase + (member.morale / 100) * model.moraleRange;
  const burnoutMult = Math.max(model.burnoutMin, 1 - member.burnout / model.burnoutDivisor);
  const talentMult = model.talentBase + Math.max(0, member.talent) * model.talentRange;
  const totalMult = levelMult * experienceMult * moraleMult * burnoutMult * talentMult;
  return scaleResourceBundle(base, totalMult);
}

export function createInitialProductionState(): ProductionState {
  const startInventory = BALANCE.production.initialInventory;
  return {
    inventory: { ...startInventory },
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
