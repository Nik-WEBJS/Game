'use client';

import { useGameStore } from '@/game/store';
import { useI18n } from '@/i18n';
import { formatMoney } from '@/lib/utils';
import { TrendingUp, TrendingDown, Minus } from 'lucide-react';

export function MiniMetrics() {
  const { business, player } = useGameStore();
  const { t } = useI18n();
  const m = business.metrics;
  const product = business.companyProducts[0];
  const lifecycle = product?.lifecycle ?? 'prototype';

  const profitSign = m.profit > 0 ? '+' : '';
  const profitColor = m.profit > 0 ? 'text-emerald-400' : m.profit < 0 ? 'text-red-400' : 'text-zinc-400';
  const ProfitIcon = m.profit > 0 ? TrendingUp : m.profit < 0 ? TrendingDown : Minus;

  const pct = (v: number) => `${Math.round(v * 100)}%`;

  return (
    <div className="bg-zinc-900/60 backdrop-blur-xl rounded-xl border border-white/10 px-3 py-2.5 min-w-[180px] shadow-lg">
      {/* Profit */}
      <div className="flex items-center justify-between gap-3 mb-1.5">
        <span className="text-[10px] text-zinc-500 uppercase tracking-wider">{t.profit}</span>
        <div className={`flex items-center gap-1 ${profitColor}`}>
          <ProfitIcon className="w-3 h-3" />
          <span className="text-xs font-bold">{profitSign}{formatMoney(m.profit)}</span>
        </div>
      </div>

      {/* Metrics bars */}
      <div className="space-y-1">
        <MetricRow label={t.quality} value={m.quality} color="bg-cyan-500" />
        <MetricRow label={t.demand} value={m.demand} color="bg-purple-500" />
        <MetricRow label={t.risk} value={m.risk} color="bg-red-500" />
        <MetricRow label={t.growth} value={m.growthRate} color="bg-emerald-500" />
      </div>

      {/* Lifecycle badge */}
      <div className="flex items-center justify-between mt-1.5 pt-1.5 border-t border-white/5">
        <span className="text-[10px] text-zinc-500 uppercase tracking-wider">{t.productStage}</span>
        <span className={`text-[10px] font-semibold px-1.5 py-0.5 rounded ${
          lifecycle === 'growth' ? 'bg-emerald-500/20 text-emerald-400' :
          lifecycle === 'decline' ? 'bg-red-500/20 text-red-400' :
          lifecycle === 'maturity' ? 'bg-amber-500/20 text-amber-400' :
          'bg-zinc-700/40 text-zinc-300'
        }`}>
          {lifecycle.toUpperCase()}
        </span>
      </div>

      {/* Team count */}
      <div className="flex items-center justify-between mt-1">
        <span className="text-[10px] text-zinc-500 uppercase tracking-wider">{t.team}</span>
        <span className="text-[10px] font-semibold text-zinc-300">
          {business.team.filter(m => m.status === 'office').length}/{business.team.length}
        </span>
      </div>
    </div>
  );
}

function MetricRow({ label, value, color }: { label: string; value: number; color: string }) {
  const pct = Math.round(value * 100);
  return (
    <div className="flex items-center gap-2">
      <span className="text-[10px] text-zinc-500 w-12 truncate">{label}</span>
      <div className="flex-1 h-1.5 bg-zinc-700/50 rounded-full overflow-hidden">
        <div
          className={`h-full rounded-full transition-all duration-300 ${color}`}
          style={{ width: `${pct}%` }}
        />
      </div>
      <span className="text-[10px] text-zinc-400 w-7 text-right font-mono">{pct}%</span>
    </div>
  );
}
