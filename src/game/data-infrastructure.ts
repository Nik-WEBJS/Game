import { InfrastructureCapacity, InfrastructureState, InfrastructureWeekReport, SupportState } from './types';
import { BALANCE } from './config/balance';

export function createCapacity(web = 0, db = 0, cache = 0): InfrastructureCapacity {
  return { web, db, cache };
}

export function createInitialInfrastructureState(): InfrastructureState {
  const base = BALANCE.infrastructure.own.baseCapacity;
  const empty = createCapacity();
  const initialCapacity = createCapacity(base.web, base.db, base.cache);
  const initialReport: InfrastructureWeekReport = {
    demand: empty,
    capacity: initialCapacity,
    utilization: empty,
    load: 0,
    latencyMs: BALANCE.infrastructure.latency.baseMs,
    outageRisk: 0,
    outage: false,
    degradation: 0,
  };
  return {
    hostingMode: 'cloud',
    cloudTier: 1,
    ownCapacity: initialCapacity,
    lastWeek: initialReport,
  };
}

export function createInitialSupportState(): SupportState {
  return {
    openTickets: 0,
    generatedLastWeek: 0,
    resolvedLastWeek: 0,
    avgWaitWeeks: 0,
    slaTargetWeeks: BALANCE.support.slaTargetWeeks,
    backlogPressure: 0,
  };
}

