'use client';

import { useMemo, useState } from 'react';
import { useGameStore } from '@/game/store';
import { Card, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Badge } from '@/components/ui/badge';
import { ProgressBar } from '@/components/ui/progress-bar';
import { formatMoney } from '@/lib/utils';
import { Building2, Server, ShieldAlert, LifeBuoy, Cloud, HardDrive, Wrench } from 'lucide-react';
import { InfrastructureServerType } from '@/game/types';

const SERVER_TYPES: InfrastructureServerType[] = ['web', 'db', 'cache'];

const SERVER_LABEL: Record<InfrastructureServerType, string> = {
  web: 'Web',
  db: 'DB',
  cache: 'Cache',
};

export function InfrastructurePanel() {
  const {
    business,
    previewEconomyBreakdown,
    setHostingMode,
    upgradeCloudTier,
    getCloudTierUpgradeCost,
    upgradeOwnServerCapacity,
    canUpgradeOwnServerCapacity,
    getOwnServerUpgradeCost,
    runSupportBurst,
  } = useGameStore();
  const [burstTickets, setBurstTickets] = useState(40);

  const infra = business.infrastructure;
  const support = business.support;
  const report = infra.lastWeek;
  const economy = previewEconomyBreakdown();
  const cloudUpgradeCost = getCloudTierUpgradeCost();

  const worstUtilization = useMemo(
    () => Math.max(report.utilization.web, report.utilization.db, report.utilization.cache),
    [report.utilization],
  );

  return (
    <Card className="p-4">
      <CardTitle className="flex items-center gap-2 text-base mb-4">
        <Building2 className="w-4 h-4 text-cyan-400" />
        Infrastructure & Support
      </CardTitle>

      <div className="rounded-lg border border-zinc-700/40 bg-zinc-800/30 p-3 mb-4">
        <div className="flex items-center justify-between mb-2">
          <div className="text-sm text-zinc-200 font-medium">Hosting mode</div>
          <Badge variant="info">
            Weekly hosting cost: {formatMoney(economy.costs.hosting)}
          </Badge>
        </div>
        <div className="flex gap-2 mb-3">
          <Button
            size="sm"
            variant={infra.hostingMode === 'cloud' ? 'primary' : 'secondary'}
            onClick={() => setHostingMode('cloud')}
          >
            <Cloud className="w-3.5 h-3.5" />
            Cloud
          </Button>
          <Button
            size="sm"
            variant={infra.hostingMode === 'own' ? 'primary' : 'secondary'}
            onClick={() => setHostingMode('own')}
          >
            <HardDrive className="w-3.5 h-3.5" />
            Own Hosting
          </Button>
        </div>

        {infra.hostingMode === 'cloud' ? (
          <div className="rounded border border-zinc-700/40 bg-zinc-900/40 p-2.5">
            <div className="flex items-center justify-between mb-1.5">
              <div className="text-sm text-zinc-200">Cloud Tier T{infra.cloudTier}</div>
              <Button
                size="sm"
                onClick={upgradeCloudTier}
                disabled={cloudUpgradeCost == null}
              >
                Upgrade {cloudUpgradeCost == null ? '(MAX)' : `(${formatMoney(cloudUpgradeCost)})`}
              </Button>
            </div>
            <div className="text-xs text-zinc-500">
              Capacity: W{Math.round(report.capacity.web)} / D{Math.round(report.capacity.db)} / C{Math.round(report.capacity.cache)}
            </div>
          </div>
        ) : (
          <div className="space-y-2">
            {SERVER_TYPES.map((type) => {
              const cost = getOwnServerUpgradeCost(type);
              const canUpgrade = canUpgradeOwnServerCapacity(type);
              return (
                <div key={type} className="rounded border border-zinc-700/40 bg-zinc-900/40 p-2.5">
                  <div className="flex items-center justify-between gap-2 mb-1">
                    <div className="text-sm text-zinc-200">{SERVER_LABEL[type]} capacity: {Math.round(infra.ownCapacity[type])}</div>
                    <Button
                      size="sm"
                      variant={canUpgrade ? 'primary' : 'secondary'}
                      disabled={!canUpgrade}
                      onClick={() => upgradeOwnServerCapacity(type)}
                    >
                      +{cost.step} ({formatMoney(cost.money)} + {cost.ops} OPS)
                    </Button>
                  </div>
                  <div className="text-[11px] text-zinc-500">
                    Utilization: {(report.utilization[type] * 100).toFixed(0)}%
                  </div>
                </div>
              );
            })}
          </div>
        )}
      </div>

      <div className="grid grid-cols-1 md:grid-cols-2 gap-3 mb-4">
        <div className="rounded-lg border border-zinc-700/40 bg-zinc-800/30 p-3">
          <div className="text-xs uppercase tracking-wider text-zinc-500 mb-2">Service Health</div>
          <ProgressBar
            value={Math.min(100, Math.round(worstUtilization * 100))}
            color={worstUtilization > 1 ? 'red' : worstUtilization > 0.85 ? 'amber' : 'emerald'}
            label="Server load"
            showValue
          />
          <div className="text-xs text-zinc-400 mt-2">Latency: {Math.round(report.latencyMs)}ms</div>
          <div className="text-xs text-zinc-400">Outage risk: {(report.outageRisk * 100).toFixed(1)}%</div>
          <div className="text-xs mt-1">
            {report.outage ? (
              <span className="text-red-300 flex items-center gap-1"><ShieldAlert className="w-3.5 h-3.5" /> Outage occurred this week</span>
            ) : (
              <span className="text-emerald-300 flex items-center gap-1"><Server className="w-3.5 h-3.5" /> No outage this week</span>
            )}
          </div>
        </div>

        <div className="rounded-lg border border-zinc-700/40 bg-zinc-800/30 p-3">
          <div className="text-xs uppercase tracking-wider text-zinc-500 mb-2">Support Queue</div>
          <div className="grid grid-cols-2 gap-1.5 mb-2 text-xs">
            <Badge variant={support.openTickets > 120 ? 'danger' : support.openTickets > 40 ? 'warning' : 'success'}>
              Open: {support.openTickets}
            </Badge>
            <Badge variant="info">Generated: {support.generatedLastWeek}</Badge>
            <Badge variant="info">Resolved: {support.resolvedLastWeek}</Badge>
            <Badge variant={support.avgWaitWeeks > support.slaTargetWeeks ? 'warning' : 'success'}>
              Avg wait: {support.avgWaitWeeks.toFixed(1)}w
            </Badge>
          </div>
          <ProgressBar
            value={Math.round(support.backlogPressure * 100)}
            color={support.backlogPressure > 0.6 ? 'red' : support.backlogPressure > 0.25 ? 'amber' : 'emerald'}
            label="Backlog pressure"
            showValue
          />
          <div className="flex items-center gap-2 mt-2">
            <input
              type="number"
              min={5}
              max={120}
              value={burstTickets}
              onChange={(e) => setBurstTickets(Math.max(5, Math.min(120, Math.round(Number(e.target.value || 5)))))}
              className="w-20 bg-zinc-900 border border-zinc-700 rounded px-2 py-1 text-xs text-zinc-200"
            />
            <Button size="sm" onClick={() => runSupportBurst(burstTickets)}>
              <LifeBuoy className="w-3.5 h-3.5" />
              Resolve burst
            </Button>
          </div>
          <div className="text-[11px] text-zinc-500 mt-1 flex items-center gap-1">
            <Wrench className="w-3 h-3" />
            Uses support inventory + money to clear backlog fast.
          </div>
        </div>
      </div>
    </Card>
  );
}
