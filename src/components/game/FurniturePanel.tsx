'use client';

import { useState, useEffect } from 'react';
import { useGameStore } from '@/game/store';
import { Card, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Badge } from '@/components/ui/badge';
import { formatMoney } from '@/lib/utils';
import { Armchair, Monitor, Server, Coffee, Presentation, Move, X, MapPin } from 'lucide-react';
import { FurnitureType } from '@/game/types';
import { FURNITURE_CATALOG } from '@/game/data-advanced';
import { startPlacement, cancelPlacement, furniturePlacement, subscribePlacement } from '@/office/furnitureState';

const TYPE_ICONS: Record<FurnitureType, typeof Monitor> = {
  desk: Monitor,
  meeting_room: Presentation,
  server_room: Server,
  lounge: Coffee,
  stage: Presentation,
};

export function FurniturePanel() {
  const { business, player, buyFurniture, unplaceFurniture } = useGameStore();
  const owned = business.furniture;
  const [placingId, setPlacingId] = useState<string | null>(null);

  // Sync with shared placement state
  useEffect(() => {
    return subscribePlacement(() => {
      setPlacingId(furniturePlacement.active ? furniturePlacement.selectedId : null);
    });
  }, []);

  return (
    <Card className="p-4">
      <CardTitle className="flex items-center gap-2 text-base mb-4">
        <Armchair className="w-4 h-4 text-amber-400" />
        Office Customization
      </CardTitle>

      {/* Placement mode banner */}
      {placingId && (
        <div className="mb-3 flex items-center gap-2 rounded-lg border border-amber-500/40 bg-amber-900/20 p-2.5">
          <MapPin className="w-4 h-4 text-amber-400 shrink-0" />
          <span className="text-xs text-amber-300 flex-1">Click a green cell in the office to place the item</span>
          <Button size="sm" variant="ghost" onClick={() => cancelPlacement()} className="!p-1">
            <X className="w-3.5 h-3.5 text-zinc-400" />
          </Button>
        </div>
      )}

      {/* Owned furniture */}
      {owned.length > 0 && (
        <div className="mb-4">
          <h3 className="text-xs font-semibold text-zinc-400 uppercase tracking-wider mb-2">Owned ({owned.length})</h3>
          <div className="space-y-1.5">
            {owned.map(f => {
              const Icon = TYPE_ICONS[f.type];
              const isPlacing = placingId === f.id;
              return (
                <div
                  key={f.id}
                  className={`flex items-center gap-2 rounded-lg px-2.5 py-2 border transition-colors ${
                    isPlacing
                      ? 'bg-amber-900/30 border-amber-500/50'
                      : 'bg-zinc-800/60 border-zinc-700/50'
                  }`}
                >
                  <Icon className="w-3.5 h-3.5 text-amber-400 shrink-0" />
                  <span className="text-xs text-zinc-200 flex-1">{f.name}</span>
                  {f.position ? (
                    <div className="flex items-center gap-1">
                      <Badge variant="success" className="text-[9px]">Placed</Badge>
                      <Button
                        size="sm"
                        variant="ghost"
                        onClick={() => startPlacement(f.id)}
                        className="!p-1"
                        title="Move"
                      >
                        <Move className="w-3 h-3 text-zinc-400" />
                      </Button>
                      <Button
                        size="sm"
                        variant="ghost"
                        onClick={() => { cancelPlacement(); unplaceFurniture(f.id); }}
                        className="!p-1"
                        title="Remove from office"
                      >
                        <X className="w-3 h-3 text-red-400" />
                      </Button>
                    </div>
                  ) : (
                    <Button
                      size="sm"
                      variant="secondary"
                      onClick={() => startPlacement(f.id)}
                      className="text-[10px] !px-2 !py-1"
                    >
                      <MapPin className="w-3 h-3 mr-1" />
                      Place
                    </Button>
                  )}
                </div>
              );
            })}
          </div>
        </div>
      )}

      {/* Catalog */}
      <h3 className="text-xs font-semibold text-zinc-400 uppercase tracking-wider mb-2">Shop</h3>
      <div className="space-y-2">
        {FURNITURE_CATALOG.map(item => {
          const Icon = TYPE_ICONS[item.type];
          const canAfford = player.money >= item.cost;
          const effectEntries = Object.entries(item.effects).filter(([, v]) => v !== 0);

          return (
            <div key={item.type} className="flex items-center justify-between gap-3 rounded-lg border border-zinc-700/50 bg-zinc-800/30 p-3">
              <div className="flex items-center gap-3 flex-1 min-w-0">
                <div className="w-8 h-8 rounded-lg bg-zinc-700/50 flex items-center justify-center shrink-0">
                  <Icon className="w-4 h-4 text-amber-400" />
                </div>
                <div className="min-w-0">
                  <div className="text-sm font-medium text-zinc-100">{item.name}</div>
                  <div className="text-[11px] text-zinc-400">{item.description}</div>
                  {effectEntries.length > 0 && (
                    <div className="flex gap-2 mt-0.5">
                      {effectEntries.map(([k, v]) => (
                        <span key={k} className="text-[10px] text-emerald-400">
                          {k.replace('Mod', '').replace('teamSlots', '+slots')}: {typeof v === 'number' && v > 0 ? '+' : ''}{typeof v === 'number' ? (k === 'teamSlotsMod' ? v : `${Math.round(v * 100)}%`) : v}
                        </span>
                      ))}
                    </div>
                  )}
                </div>
              </div>
              <Button
                size="sm"
                variant={canAfford ? 'primary' : 'secondary'}
                disabled={!canAfford}
                onClick={() => buyFurniture(item.type)}
                className="shrink-0 text-xs"
              >
                {formatMoney(item.cost)}
              </Button>
            </div>
          );
        })}
      </div>
    </Card>
  );
}
