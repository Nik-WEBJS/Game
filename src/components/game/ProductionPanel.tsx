'use client';

import { useMemo, useState } from 'react';
import { useGameStore } from '@/game/store';
import { ProductionResourceBundle, ProductionResourceId } from '@/game/types';
import { Card, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Badge } from '@/components/ui/badge';
import { Boxes, Factory, ArrowUp, ArrowDown, Trash2, PlusCircle } from 'lucide-react';

const RESOURCES: ProductionResourceId[] = ['code', 'design', 'ops', 'support'];

const RESOURCE_LABEL: Record<ProductionResourceId, string> = {
  code: 'Code',
  design: 'Design',
  ops: 'Ops',
  support: 'Support',
};

export function ProductionPanel() {
  const {
    business,
    enqueueProductionQueue,
    cancelProductionQueue,
    moveProductionQueue,
    estimateProductionOutput,
  } = useGameStore();
  const [resource, setResource] = useState<ProductionResourceId>('code');
  const [units, setUnits] = useState(30);
  const production = business.production;
  const weeklyOutput = estimateProductionOutput();

  const queue = useMemo(
    () => [...production.queue].sort((a, b) => a.priority - b.priority),
    [production.queue],
  );

  const handleQueue = () => {
    enqueueProductionQueue(resource, units);
    setUnits(Math.min(300, Math.max(10, units)));
  };

  return (
    <Card className="p-4">
      <CardTitle className="flex items-center gap-2 text-base mb-4">
        <Factory className="w-4 h-4 text-cyan-400" />
        Production Chain
      </CardTitle>

      <div className="grid grid-cols-2 lg:grid-cols-4 gap-2 mb-4">
        {RESOURCES.map((res) => (
          <div key={res} className="rounded-lg border border-zinc-700/40 bg-zinc-800/30 p-2.5">
            <div className="flex items-center justify-between mb-1">
              <span className="text-[11px] text-zinc-400">{RESOURCE_LABEL[res]}</span>
              <Badge variant="info">{production.inventory[res]}</Badge>
            </div>
            <div className="text-[11px] text-zinc-500">Output/wk: {weeklyOutput[res]}</div>
            <div className="text-[11px] text-zinc-500">Delivered: {production.lastWeek.delivered[res]}</div>
            <div className="text-[11px] text-zinc-500">Consumed: {production.lastWeek.consumed[res]}</div>
          </div>
        ))}
      </div>

      <div className="rounded-lg border border-zinc-700/40 bg-zinc-800/30 p-3 mb-4">
        <div className="text-xs uppercase tracking-wider text-zinc-500 mb-2">Queue new batch</div>
        <div className="flex flex-wrap items-center gap-2">
          <select
            value={resource}
            onChange={(e) => setResource(e.target.value as ProductionResourceId)}
            className="bg-zinc-900 border border-zinc-700 rounded px-2 py-1.5 text-xs text-zinc-200"
          >
            {RESOURCES.map((res) => (
              <option key={res} value={res}>{RESOURCE_LABEL[res]}</option>
            ))}
          </select>
          <input
            type="number"
            min={1}
            max={999}
            value={units}
            onChange={(e) => setUnits(Math.max(1, Math.min(999, Math.round(Number(e.target.value || 1)))))}
            className="w-24 bg-zinc-900 border border-zinc-700 rounded px-2 py-1.5 text-xs text-zinc-200"
          />
          <Button size="sm" onClick={handleQueue}>
            <PlusCircle className="w-3.5 h-3.5" />
            Add queue item
          </Button>
          <button
            onClick={() => setUnits(15)}
            className="px-2 py-1 text-xs rounded bg-zinc-900 border border-zinc-700 text-zinc-300 hover:border-zinc-500"
          >
            x15
          </button>
          <button
            onClick={() => setUnits(30)}
            className="px-2 py-1 text-xs rounded bg-zinc-900 border border-zinc-700 text-zinc-300 hover:border-zinc-500"
          >
            x30
          </button>
          <button
            onClick={() => setUnits(60)}
            className="px-2 py-1 text-xs rounded bg-zinc-900 border border-zinc-700 text-zinc-300 hover:border-zinc-500"
          >
            x60
          </button>
        </div>
      </div>

      <div className="rounded-lg border border-zinc-700/40 bg-zinc-800/30 p-3">
        <div className="flex items-center justify-between mb-2">
          <div className="text-xs uppercase tracking-wider text-zinc-500">Production queue</div>
          <div className="text-[11px] text-zinc-500">
            Completed last week: {production.lastWeek.completedQueueIds.length}
          </div>
        </div>

        {queue.length === 0 ? (
          <div className="text-sm text-zinc-500">Queue is empty. Add production batches to fill inventory.</div>
        ) : (
          <div className="space-y-2">
            {queue.map((item, index) => {
              const progressPct = Math.max(0, Math.min(100, (item.progress / item.units) * 100));
              const weekly = Math.max(1, weeklyOutput[item.resource]);
              const eta = Math.max(1, Math.ceil((item.units - item.progress) / weekly));
              return (
                <div key={item.id} className="rounded border border-zinc-700/40 bg-zinc-900/40 p-2.5">
                  <div className="flex items-center justify-between gap-2 mb-1.5">
                    <div className="text-sm text-zinc-200">
                      {RESOURCE_LABEL[item.resource]} batch #{index + 1}
                    </div>
                    <div className="flex items-center gap-1">
                      <button
                        onClick={() => moveProductionQueue(item.id, -1)}
                        disabled={index === 0}
                        className="w-6 h-6 rounded border border-zinc-700 text-zinc-300 disabled:opacity-30"
                        title="Move up"
                      >
                        <ArrowUp className="w-3.5 h-3.5 mx-auto" />
                      </button>
                      <button
                        onClick={() => moveProductionQueue(item.id, 1)}
                        disabled={index === queue.length - 1}
                        className="w-6 h-6 rounded border border-zinc-700 text-zinc-300 disabled:opacity-30"
                        title="Move down"
                      >
                        <ArrowDown className="w-3.5 h-3.5 mx-auto" />
                      </button>
                      <button
                        onClick={() => cancelProductionQueue(item.id)}
                        className="w-6 h-6 rounded border border-red-700/60 text-red-300"
                        title="Cancel"
                      >
                        <Trash2 className="w-3.5 h-3.5 mx-auto" />
                      </button>
                    </div>
                  </div>
                  <div className="text-[11px] text-zinc-500 mb-1">
                    Progress: {Math.round(item.progress)}/{item.units} | ETA: {eta}w
                  </div>
                  <div className="h-2 rounded bg-zinc-800 border border-zinc-700/40 overflow-hidden">
                    <div className="h-full bg-cyan-500/90" style={{ width: `${progressPct}%` }} />
                  </div>
                </div>
              );
            })}
          </div>
        )}
      </div>

      <div className="mt-3 flex items-center gap-2 flex-wrap">
        <Badge variant="default">
          <Boxes className="w-3 h-3 mr-1" />
          Idle last week: {formatBundle(production.lastWeek.idle)}
        </Badge>
        <Badge variant="default">
          Output last week: {formatBundle(production.lastWeek.output)}
        </Badge>
      </div>
    </Card>
  );
}

function formatBundle(bundle: ProductionResourceBundle): string {
  return `C${bundle.code} D${bundle.design} O${bundle.ops} S${bundle.support}`;
}
