'use client';

import { useGameStore } from '@/game/store';
import { useI18n } from '@/i18n';
import { Card, CardTitle } from '@/components/ui/card';
import { ProgressBar } from '@/components/ui/progress-bar';
import { formatMoney } from '@/lib/utils';
import {
  TrendingUp, TrendingDown, BarChart3, DollarSign,
} from 'lucide-react';

export function MetricsPanel() {
  const { business } = useGameStore();
  const { t } = useI18n();
  const m = business.metrics;

  const metrics = [
    {
      label: t.revenue,
      value: formatMoney(m.revenue),
      icon: DollarSign,
      color: 'text-emerald-400',
    },
    {
      label: t.costs,
      value: formatMoney(m.costs),
      icon: TrendingDown,
      color: 'text-red-400',
    },
    {
      label: t.profit,
      value: formatMoney(m.profit),
      icon: m.profit >= 0 ? TrendingUp : TrendingDown,
      color: m.profit >= 0 ? 'text-emerald-400' : 'text-red-400',
    },
    {
      label: t.growth,
      value: `${(m.growthRate * 100).toFixed(1)}%`,
      icon: BarChart3,
      color: m.growthRate >= 0 ? 'text-cyan-400' : 'text-amber-400',
    },
  ];

  return (
    <Card>
      <CardTitle className="flex items-center gap-2 mb-4">
        <BarChart3 className="w-5 h-5 text-emerald-400" />
        {t.businessMetrics}
      </CardTitle>

      <div className="grid grid-cols-2 gap-3 mb-4">
        {metrics.map(metric => {
          const Icon = metric.icon;
          return (
            <div key={metric.label} className="bg-zinc-800/50 rounded-lg p-3">
              <div className="flex items-center gap-1.5 mb-1">
                <Icon className={`w-3.5 h-3.5 ${metric.color}`} />
                <span className="text-xs text-zinc-400">{metric.label}</span>
              </div>
              <span className={`text-lg font-bold ${metric.color}`}>{metric.value}</span>
            </div>
          );
        })}
      </div>

      <div className="space-y-3">
        <ProgressBar
          value={m.quality * 100}
          color="emerald"
          label={t.quality}
          showValue
        />
        <ProgressBar
          value={m.demand * 100}
          color="blue"
          label={t.demand}
          showValue
        />
        <ProgressBar
          value={m.risk * 100}
          color={m.risk > 0.6 ? 'red' : m.risk > 0.3 ? 'amber' : 'emerald'}
          label={t.risk}
          showValue
        />
        <ProgressBar
          value={m.teamEfficiency * 100}
          color="purple"
          label={t.teamEfficiency}
          showValue
        />
      </div>
    </Card>
  );
}
