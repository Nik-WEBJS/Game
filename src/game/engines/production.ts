import { GameState, ProductionQueueItem, ProductionResourceBundle, ProductionResourceId } from '../types';
import {
  addResourceBundles,
  createEmptyResourceBundle,
  getMemberProductionOutput,
  hasRequiredResources,
  normalizeResourceRequirements,
  roundResourceBundle,
  subtractResourceBundles,
} from '../data-production';
import { isManagerBusyWithISO } from './iso';

function sortQueue(queue: ProductionQueueItem[]): ProductionQueueItem[] {
  return [...queue].sort((a, b) => {
    if (a.priority !== b.priority) return a.priority - b.priority;
    if (a.createdWeek !== b.createdWeek) return a.createdWeek - b.createdWeek;
    return a.id.localeCompare(b.id);
  });
}

function normalizeQueuePriorities(queue: ProductionQueueItem[]): ProductionQueueItem[] {
  return sortQueue(queue).map((item, idx) => ({ ...item, priority: idx }));
}

function resourceLabel(resource: ProductionResourceId): string {
  switch (resource) {
    case 'code': return 'Code';
    case 'design': return 'Design';
    case 'ops': return 'Ops';
    case 'support': return 'Support';
    default: return resource;
  }
}

export function estimateWeeklyProductionOutput(state: GameState): ProductionResourceBundle {
  const managerBusy = isManagerBusyWithISO(state);
  let output = createEmptyResourceBundle();
  for (const member of state.business.team) {
    if (member.status !== 'office') continue;
    if (managerBusy && member.role === 'manager') continue;
    output = addResourceBundles(output, getMemberProductionOutput(member));
  }
  return roundResourceBundle(output);
}

export function tickProduction(state: GameState): GameState {
  const production = state.business.production;
  const output = estimateWeeklyProductionOutput(state);
  const available = { ...output };
  const delivered = createEmptyResourceBundle();
  const blockedQueueIds: string[] = [];
  const completedQueueIds: string[] = [];
  const nextQueue: ProductionQueueItem[] = [];

  for (const queueItem of sortQueue(production.queue)) {
    const remaining = Math.max(0, queueItem.units - queueItem.progress);
    if (remaining <= 0) {
      completedQueueIds.push(queueItem.id);
      continue;
    }

    const capacity = available[queueItem.resource];
    if (capacity <= 0) {
      blockedQueueIds.push(queueItem.id);
      nextQueue.push(queueItem);
      continue;
    }

    const allocated = Math.min(remaining, capacity);
    const newProgress = queueItem.progress + allocated;
    available[queueItem.resource] = Math.max(0, capacity - allocated);

    if (newProgress + 1e-9 >= queueItem.units) {
      delivered[queueItem.resource] += queueItem.units;
      completedQueueIds.push(queueItem.id);
      continue;
    }

    nextQueue.push({ ...queueItem, progress: newProgress });
  }

  const idle = { ...available };
  const inventory = addResourceBundles(production.inventory, delivered);
  const normalizedQueue = normalizeQueuePriorities(nextQueue);
  const nextProduction = {
    ...production,
    inventory,
    queue: normalizedQueue,
    pendingConsumed: createEmptyResourceBundle(),
    lastWeek: {
      output,
      delivered,
      consumed: production.pendingConsumed,
      idle,
      completedQueueIds,
      blockedQueueIds,
    },
  };

  let logs = state.logs;
  if (completedQueueIds.length > 0) {
    logs = [
      ...logs,
      {
        week: state.player.currentWeek,
        type: 'success',
        message: `Production completed: ${completedQueueIds.length} queue item(s) delivered.`,
      },
    ];
  }

  return {
    ...state,
    business: {
      ...state.business,
      production: nextProduction,
    },
    logs,
  };
}

export function enqueueProduction(
  state: GameState,
  resource: ProductionResourceId,
  units: number,
): GameState {
  const production = state.business.production;
  const normalizedUnits = Math.max(1, Math.round(units));
  const item: ProductionQueueItem = {
    id: `pq_${production.nextQueueSeq}`,
    resource,
    units: normalizedUnits,
    progress: 0,
    createdWeek: state.player.currentWeek,
    priority: production.queue.length,
  };

  return {
    ...state,
    business: {
      ...state.business,
      production: {
        ...production,
        nextQueueSeq: production.nextQueueSeq + 1,
        queue: normalizeQueuePriorities([...production.queue, item]),
      },
    },
    logs: [
      ...state.logs,
      {
        week: state.player.currentWeek,
        type: 'info',
        message: `Production queued: ${resourceLabel(resource)} x${normalizedUnits}.`,
      },
    ],
  };
}

export function cancelProductionQueueItem(state: GameState, queueId: string): GameState {
  const production = state.business.production;
  const item = production.queue.find(q => q.id === queueId);
  if (!item) return state;

  return {
    ...state,
    business: {
      ...state.business,
      production: {
        ...production,
        queue: normalizeQueuePriorities(production.queue.filter(q => q.id !== queueId)),
      },
    },
    logs: [
      ...state.logs,
      {
        week: state.player.currentWeek,
        type: 'warning',
        message: `Production canceled: ${resourceLabel(item.resource)} queue item.`,
      },
    ],
  };
}

export function moveProductionQueueItem(state: GameState, queueId: string, direction: -1 | 1): GameState {
  const production = state.business.production;
  const sorted = sortQueue(production.queue);
  const index = sorted.findIndex(item => item.id === queueId);
  if (index < 0) return state;

  const target = index + direction;
  if (target < 0 || target >= sorted.length) return state;

  const swapped = [...sorted];
  const tmp = swapped[index];
  swapped[index] = swapped[target];
  swapped[target] = tmp;

  return {
    ...state,
    business: {
      ...state.business,
      production: {
        ...production,
        queue: normalizeQueuePriorities(swapped),
      },
    },
  };
}

export function canConsumeProductionResources(
  state: GameState,
  required: Partial<ProductionResourceBundle> | undefined,
): boolean {
  return hasRequiredResources(state.business.production.inventory, required);
}

export function consumeProductionResources(
  state: GameState,
  required: Partial<ProductionResourceBundle> | undefined,
): GameState {
  const normalized = normalizeResourceRequirements(required);
  if (!hasRequiredResources(state.business.production.inventory, normalized)) return state;

  const production = state.business.production;
  return {
    ...state,
    business: {
      ...state.business,
      production: {
        ...production,
        inventory: subtractResourceBundles(production.inventory, normalized),
        pendingConsumed: addResourceBundles(production.pendingConsumed, normalized),
      },
    },
  };
}
