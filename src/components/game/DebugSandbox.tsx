'use client';

import { useMemo, useState } from 'react';
import { useGameStore } from '@/game/store';
import { EVENTS_POOL } from '@/game/data';
import { Bug, Play, Pause, FastForward, Zap, X, Trash2 } from 'lucide-react';

export function DebugSandbox() {
  const {
    phase,
    player,
    setGameSpeed,
    debugAdvanceWeeks,
    debugTriggerEvent,
    previewEconomyBreakdown,
    debugClearSave,
  } = useGameStore();
  const [open, setOpen] = useState(false);
  const [weeks, setWeeks] = useState(4);
  const [eventId, setEventId] = useState(EVENTS_POOL[0]?.id ?? '');

  const breakdown = previewEconomyBreakdown();

  const topFactors = useMemo(() => {
    const f = breakdown.combination.factors;
    const factors = [
      { label: 'Audience', value: f.avgAudience - 0.5 },
      { label: 'Product fit', value: f.productFit - 1 },
      { label: 'Tech synergy', value: f.techSynergy - 1 },
      { label: 'Lifecycle', value: f.lifecycleMult - 0.5 },
      { label: 'Client tier', value: f.clientTierMult - 0.5 },
      { label: 'Team efficiency', value: f.teamEfficiency - 0.5 },
      { label: 'ISO stabilization', value: f.isoStabilization },
      { label: 'Tech complexity', value: -f.totalTechComplexity },
      { label: 'Team load', value: -f.teamLoad },
    ];
    return factors.sort((a, b) => Math.abs(b.value) - Math.abs(a.value)).slice(0, 5);
  }, [breakdown]);

  if (!open) {
    return (
      <button
        onClick={() => setOpen(true)}
        className="fixed bottom-4 left-4 z-[60] w-11 h-11 rounded-full bg-zinc-900/80 border border-zinc-600/60 shadow-xl flex items-center justify-center hover:border-zinc-400/70 transition-colors"
        title="Open debug sandbox"
      >
        <Bug className="w-5 h-5 text-amber-300" />
      </button>
    );
  }

  const combo = breakdown.combination.result;
  const costs = breakdown.costs;
  const f = breakdown.combination.factors;

  return (
    <div className="fixed bottom-4 left-4 z-[70] w-[360px] max-h-[80vh] overflow-y-auto rounded-xl border border-zinc-600/60 bg-zinc-950/90 backdrop-blur-xl shadow-2xl p-3">
      <div className="flex items-center justify-between mb-3">
        <div className="flex items-center gap-2">
          <Bug className="w-4 h-4 text-amber-300" />
          <span className="text-sm font-semibold text-zinc-100">Debug Sandbox</span>
        </div>
        <button onClick={() => setOpen(false)} className="text-zinc-500 hover:text-zinc-200">
          <X className="w-4 h-4" />
        </button>
      </div>

      <div className="text-[11px] text-zinc-400 mb-3">
        Phase: <span className="text-zinc-200">{phase}</span> | Week: <span className="text-zinc-200">{player.currentWeek}</span>
      </div>

      <div className="grid grid-cols-4 gap-1 mb-3">
        <button onClick={() => setGameSpeed(0)} className="px-2 py-1 rounded bg-zinc-800 text-zinc-200 text-xs border border-zinc-700 hover:border-zinc-500"><Pause className="w-3.5 h-3.5 inline mr-1" />0x</button>
        <button onClick={() => setGameSpeed(1)} className="px-2 py-1 rounded bg-zinc-800 text-zinc-200 text-xs border border-zinc-700 hover:border-zinc-500"><Play className="w-3.5 h-3.5 inline mr-1" />1x</button>
        <button onClick={() => setGameSpeed(2)} className="px-2 py-1 rounded bg-zinc-800 text-zinc-200 text-xs border border-zinc-700 hover:border-zinc-500"><FastForward className="w-3.5 h-3.5 inline mr-1" />2x</button>
        <button onClick={() => setGameSpeed(3)} className="px-2 py-1 rounded bg-zinc-800 text-zinc-200 text-xs border border-zinc-700 hover:border-zinc-500"><Zap className="w-3.5 h-3.5 inline mr-1" />3x</button>
      </div>

      <div className="rounded-lg border border-zinc-700 bg-zinc-900/50 p-2 mb-3">
        <div className="text-xs text-zinc-300 mb-2">Fast-forward weeks</div>
        <div className="flex items-center gap-2">
          <input
            type="number"
            min={1}
            max={520}
            value={weeks}
            onChange={(e) => setWeeks(Math.max(1, Math.min(520, Number(e.target.value || 1))))}
            className="w-20 bg-zinc-800 border border-zinc-700 rounded px-2 py-1 text-xs text-zinc-100"
          />
          <button
            onClick={() => debugAdvanceWeeks(weeks)}
            className="px-2 py-1 rounded bg-cyan-700/60 border border-cyan-600/60 text-xs text-cyan-100 hover:bg-cyan-700"
          >
            Run
          </button>
          <button onClick={() => debugAdvanceWeeks(1)} className="px-2 py-1 rounded bg-zinc-800 text-xs border border-zinc-700 text-zinc-200">+1w</button>
          <button onClick={() => debugAdvanceWeeks(12)} className="px-2 py-1 rounded bg-zinc-800 text-xs border border-zinc-700 text-zinc-200">+12w</button>
        </div>
      </div>

      <div className="rounded-lg border border-zinc-700 bg-zinc-900/50 p-2 mb-3">
        <div className="text-xs text-zinc-300 mb-2">Force event</div>
        <div className="flex items-center gap-2">
          <select
            value={eventId}
            onChange={(e) => setEventId(e.target.value)}
            className="flex-1 bg-zinc-800 border border-zinc-700 rounded px-2 py-1 text-xs text-zinc-100"
          >
            {EVENTS_POOL.map(evt => (
              <option key={evt.id} value={evt.id}>{evt.id}</option>
            ))}
          </select>
          <button
            onClick={() => debugTriggerEvent(eventId)}
            className="px-2 py-1 rounded bg-amber-700/60 border border-amber-600/60 text-xs text-amber-100 hover:bg-amber-700"
          >
            Trigger
          </button>
        </div>
      </div>

      <div className="rounded-lg border border-zinc-700 bg-zinc-900/50 p-2 mb-3">
        <div className="text-xs text-zinc-300 mb-2">Formula inspector</div>
        <div className="text-[11px] text-zinc-400 space-y-1">
          <div>Revenue: <span className="text-zinc-100">${Math.round(combo.revenue).toLocaleString()}</span></div>
          <div>Costs: <span className="text-zinc-100">${Math.round(costs.total).toLocaleString()}</span></div>
          <div>Profit: <span className={combo.revenue - costs.total >= 0 ? 'text-emerald-300' : 'text-red-300'}>${Math.round(combo.revenue - costs.total).toLocaleString()}</span></div>
          <div>Demand: <span className="text-zinc-100">{(combo.demand * 100).toFixed(1)}%</span></div>
          <div>Quality: <span className="text-zinc-100">{(combo.quality * 100).toFixed(1)}%</span></div>
          <div>Risk: <span className="text-zinc-100">{(combo.risk * 100).toFixed(1)}%</span></div>
          <div>Audience: <span className="text-zinc-100">{(f.avgAudience * 100).toFixed(1)}%</span></div>
          <div>Lifecycle mult: <span className="text-zinc-100">{f.lifecycleMult.toFixed(2)}</span></div>
          <div>Client tier mult: <span className="text-zinc-100">{f.clientTierMult.toFixed(2)}</span></div>
          <div>Tech synergy: <span className="text-zinc-100">{f.techSynergy.toFixed(2)}</span></div>
        </div>
      </div>

      <div className="rounded-lg border border-zinc-700 bg-zinc-900/50 p-2 mb-3">
        <div className="text-xs text-zinc-300 mb-2">Top factors</div>
        <div className="space-y-1">
          {topFactors.map((factor) => (
            <div key={factor.label} className="flex items-center justify-between text-[11px]">
              <span className="text-zinc-400">{factor.label}</span>
              <span className={factor.value >= 0 ? 'text-emerald-300' : 'text-red-300'}>
                {factor.value >= 0 ? '+' : ''}{(factor.value * 100).toFixed(1)}
              </span>
            </div>
          ))}
        </div>
      </div>

      <div className="flex items-center justify-between">
        <span className="text-[11px] text-zinc-500">Local save controls</span>
        <button
          onClick={debugClearSave}
          className="px-2 py-1 rounded bg-red-900/40 border border-red-800/60 text-[11px] text-red-300 hover:bg-red-900/60"
        >
          <Trash2 className="w-3 h-3 inline mr-1" />
          Clear save
        </button>
      </div>
    </div>
  );
}
