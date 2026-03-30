'use client';

import { useMemo, type ReactNode } from 'react';
import { useGameStore } from '@/game/store';
import { PRODUCT_FEATURE_TEMPLATES } from '@/game/data-product';
import { Card, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Badge } from '@/components/ui/badge';
import { ProgressBar } from '@/components/ui/progress-bar';
import { formatMoney } from '@/lib/utils';
import { Boxes, PlusCircle, TrendingUp, Users } from 'lucide-react';

const CLASS_LABEL: Record<string, string> = {
  core: 'Core',
  growth: 'Growth',
  monetization: 'Monetization',
  infrastructure: 'Infrastructure',
};

function reasonText(reason?: string): string {
  switch (reason) {
    case 'not_found': return 'Feature not found';
    case 'already_installed': return 'Already installed';
    case 'incompatible_product': return 'Incompatible with this product type';
    case 'reputation_required': return 'Reputation requirement not met';
    case 'missing_prerequisites': return 'Missing prerequisite feature';
    case 'not_enough_money': return 'Not enough money';
    case 'no_slots': return 'No free feature slots';
    case 'not_installed': return 'Install feature first';
    case 'max_level': return 'Max level reached';
    default: return 'Unavailable';
  }
}

export function ProductPanel() {
  const {
    player,
    business,
    installProductFeature,
    upgradeProductFeature,
    buyProductFeatureSlot,
    canInstallProductFeature,
    canUpgradeProductFeature,
    getProductFeatureSlotCost,
  } = useGameStore();

  const live = business.liveProduct;
  const metrics = live?.metrics;

  const usedSlots = useMemo(() => {
    if (!live) return 0;
    return live.features
      .filter(f => f.installed)
      .reduce((sum, f) => sum + (PRODUCT_FEATURE_TEMPLATES.find(t => t.id === f.id)?.slotCost ?? 0), 0);
  }, [live]);

  if (!live || !metrics) {
    return (
      <Card>
        <CardTitle className="flex items-center gap-2 mb-2">
          <Boxes className="w-5 h-5 text-indigo-400" />
          Product Dashboard
        </CardTitle>
        <p className="text-sm text-zinc-500">Start the game to initialize live product metrics.</p>
      </Card>
    );
  }

  const slotCost = getProductFeatureSlotCost();
  const classes: Array<'core' | 'growth' | 'monetization' | 'infrastructure'> = ['core', 'growth', 'monetization', 'infrastructure'];
  const deltas = live.lastWeek?.deltas ?? {
    traffic: 0,
    signups: 0,
    activeUsers: 0,
    payingUsers: 0,
    satisfaction: 0,
    conversion: 0,
    churn: 0,
  };

  return (
    <Card className="p-4">
      <CardTitle className="flex items-center gap-2 text-base mb-4">
        <Boxes className="w-4 h-4 text-indigo-400" />
        Live Product
      </CardTitle>

      <div className="grid grid-cols-2 lg:grid-cols-4 gap-2 mb-4">
        <MetricCard label="Traffic" value={metrics.traffic.toLocaleString()} icon={<TrendingUp className="w-3 h-3 text-cyan-400" />} />
        <MetricCard label="Signups" value={metrics.signups.toLocaleString()} icon={<Users className="w-3 h-3 text-emerald-400" />} />
        <MetricCard label="Active users" value={metrics.activeUsers.toLocaleString()} icon={<Users className="w-3 h-3 text-blue-400" />} />
        <MetricCard label="Paying users" value={metrics.payingUsers.toLocaleString()} icon={<Users className="w-3 h-3 text-amber-400" />} />
      </div>

      <div className="space-y-2 mb-4">
        <ProgressBar value={Math.round(metrics.satisfaction * 100)} color="emerald" label="Satisfaction" showValue />
        <ProgressBar value={Math.round(metrics.conversion * 100)} color="blue" label="Conversion" showValue />
        <ProgressBar value={Math.round(metrics.churn * 100)} color={metrics.churn > 0.12 ? 'red' : 'amber'} label="Churn" showValue />
      </div>

      <div className="rounded-lg border border-zinc-700/40 bg-zinc-800/30 p-3 mb-4">
        <div className="flex items-center justify-between mb-2">
          <span className="text-sm text-zinc-200 font-medium">Feature slots</span>
          <Badge variant={usedSlots < live.featureSlots ? 'success' : 'warning'}>{usedSlots}/{live.featureSlots}</Badge>
        </div>
        <Button
          size="sm"
          onClick={buyProductFeatureSlot}
          disabled={player.money < slotCost}
          className="text-xs"
        >
          <PlusCircle className="w-3.5 h-3.5" />
          Buy slot ({formatMoney(slotCost)})
        </Button>
      </div>

      <div className="space-y-4">
        {classes.map((cls) => {
          const items = PRODUCT_FEATURE_TEMPLATES.filter(f => f.class === cls);
          return (
            <div key={cls}>
              <div className="text-xs uppercase tracking-wider text-zinc-500 mb-2">{CLASS_LABEL[cls]}</div>
              <div className="space-y-2">
                {items.map((tpl) => {
                  const installed = live.features.find(f => f.id === tpl.id && f.installed);
                  const installCheck = canInstallProductFeature(tpl.id);
                  const upgradeCheck = canUpgradeProductFeature(tpl.id);
                  const prerequisites = tpl.requiredFeatureIds ?? [];
                  return (
                    <div key={tpl.id} className="rounded-lg border border-zinc-700/40 bg-zinc-800/30 p-3">
                      <div className="flex items-start justify-between gap-3">
                        <div className="min-w-0">
                          <div className="flex items-center gap-2 mb-1">
                            <span className="text-sm text-zinc-100 font-medium">{tpl.name}</span>
                            {installed && <Badge variant="info">Lv{installed.level}</Badge>}
                          </div>
                          <p className="text-[11px] text-zinc-400">{tpl.description}</p>
                          {prerequisites.length > 0 && (
                            <div className="mt-1 text-[10px] text-zinc-500">
                              Requires: {prerequisites.join(', ')}
                            </div>
                          )}
                          {tpl.requiredReputation && (
                            <div className="text-[10px] text-zinc-500">
                              Reputation: {tpl.requiredReputation}+
                            </div>
                          )}
                          <div className="flex gap-2 mt-1.5 flex-wrap">
                            {tpl.effects.trafficBoost ? <Badge variant="success">+Traffic</Badge> : null}
                            {tpl.effects.conversionBoost ? <Badge variant="success">+Conversion</Badge> : null}
                            {tpl.effects.retentionBoost ? <Badge variant="success">+Retention</Badge> : null}
                            {tpl.effects.monetizationBoost ? <Badge variant="success">+Monetization</Badge> : null}
                            {tpl.effects.reliabilityBoost ? <Badge variant="success">+Reliability</Badge> : null}
                          </div>
                        </div>
                        <div className="flex flex-col gap-1 shrink-0">
                          {!installed ? (
                            <Button
                              size="sm"
                              variant={installCheck.ok ? 'primary' : 'secondary'}
                              disabled={!installCheck.ok}
                              onClick={() => installProductFeature(tpl.id)}
                              className="text-xs"
                              title={installCheck.ok ? '' : reasonText(installCheck.reason)}
                            >
                              Install ({formatMoney(tpl.unlockCost)})
                            </Button>
                          ) : (
                            <Button
                              size="sm"
                              variant={upgradeCheck.ok ? 'primary' : 'secondary'}
                              disabled={!upgradeCheck.ok}
                              onClick={() => upgradeProductFeature(tpl.id)}
                              className="text-xs"
                              title={upgradeCheck.ok ? '' : reasonText(upgradeCheck.reason)}
                            >
                              Upgrade ({formatMoney(upgradeCheck.cost ?? 0)})
                            </Button>
                          )}
                          {!installed && !installCheck.ok && <span className="text-[10px] text-zinc-500 text-right">{reasonText(installCheck.reason)}</span>}
                          {installed && !upgradeCheck.ok && <span className="text-[10px] text-zinc-500 text-right">{reasonText(upgradeCheck.reason)}</span>}
                        </div>
                      </div>
                    </div>
                  );
                })}
              </div>
            </div>
          );
        })}
      </div>

      {(live.lastWeek.topPositiveFactors.length > 0 || live.lastWeek.topNegativeFactors.length > 0) && (
        <div className="mt-4 rounded-lg border border-zinc-700/40 bg-zinc-800/30 p-3">
          <div className="text-xs uppercase tracking-wider text-zinc-500 mb-2">Weekly explainability</div>
          <div className="grid grid-cols-2 md:grid-cols-4 gap-1.5 mb-2 text-[11px]">
            <DeltaChip label="Traffic" value={deltas.traffic} />
            <DeltaChip label="Signups" value={deltas.signups} />
            <DeltaChip label="Active" value={deltas.activeUsers} />
            <DeltaChip label="Paying" value={deltas.payingUsers} />
          </div>
          <div className="grid grid-cols-1 md:grid-cols-3 gap-1.5 mb-2 text-[11px]">
            <PercentDeltaChip label="Satisfaction" value={deltas.satisfaction} />
            <PercentDeltaChip label="Conversion" value={deltas.conversion} />
            <PercentDeltaChip label="Churn" value={deltas.churn} inverseColor />
          </div>
          <div className="grid grid-cols-1 md:grid-cols-2 gap-2 text-xs">
            <div>
              <div className="text-emerald-300 mb-1">Top positive</div>
              {live.lastWeek.topPositiveFactors.map((line) => (
                <div key={line} className="text-zinc-300">• {line}</div>
              ))}
            </div>
            <div>
              <div className="text-red-300 mb-1">Top negative</div>
              {live.lastWeek.topNegativeFactors.map((line) => (
                <div key={line} className="text-zinc-300">• {line}</div>
              ))}
            </div>
          </div>
          {live.lastWeek.bottlenecks.length > 0 && (
            <div className="mt-2">
              <div className="text-amber-300 text-xs mb-1">Bottlenecks</div>
              {live.lastWeek.bottlenecks.map((line) => (
                <div key={line} className="text-[11px] text-amber-200">• {line}</div>
              ))}
            </div>
          )}
        </div>
      )}
    </Card>
  );
}

function MetricCard({ label, value, icon }: { label: string; value: string; icon: ReactNode }) {
  return (
    <div className="rounded-lg bg-zinc-800/40 border border-zinc-700/40 p-2.5">
      <div className="flex items-center gap-1.5 text-zinc-400 text-[11px] mb-1">
        {icon}
        <span>{label}</span>
      </div>
      <div className="text-sm font-semibold text-zinc-100">{value}</div>
    </div>
  );
}

function DeltaChip({ label, value }: { label: string; value: number }) {
  const sign = value >= 0 ? '+' : '';
  const good = value >= 0;
  return (
    <div className="rounded border border-zinc-700/40 bg-zinc-900/40 px-2 py-1">
      <div className="text-zinc-500 text-[10px]">{label}</div>
      <div className={good ? 'text-emerald-300' : 'text-red-300'}>{sign}{value}</div>
    </div>
  );
}

function PercentDeltaChip({ label, value, inverseColor = false }: { label: string; value: number; inverseColor?: boolean }) {
  const sign = value >= 0 ? '+' : '';
  const isGood = inverseColor ? value <= 0 : value >= 0;
  return (
    <div className="rounded border border-zinc-700/40 bg-zinc-900/40 px-2 py-1">
      <div className="text-zinc-500 text-[10px]">{label}</div>
      <div className={isGood ? 'text-emerald-300' : 'text-red-300'}>
        {sign}{(value * 100).toFixed(2)}pp
      </div>
    </div>
  );
}
