'use client';

import { useGameStore } from '@/game/store';
import { useI18n } from '@/i18n';
import { Card, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Badge } from '@/components/ui/badge';
import { formatMoney } from '@/lib/utils';
import { ShoppingBag, Star, Sparkles, Crown, User } from 'lucide-react';
import { CandidateRarity } from '@/game/types';
import { TRAITS } from '@/game/data-advanced';

const RARITY_STYLES: Record<CandidateRarity, { bg: string; text: string; border: string }> = {
  common: { bg: 'bg-zinc-700/50', text: 'text-zinc-300', border: 'border-zinc-600/50' },
  uncommon: { bg: 'bg-emerald-900/30', text: 'text-emerald-400', border: 'border-emerald-700/50' },
  rare: { bg: 'bg-blue-900/30', text: 'text-blue-400', border: 'border-blue-700/50' },
  legendary: { bg: 'bg-amber-900/30', text: 'text-amber-400', border: 'border-amber-700/50' },
};

const RARITY_ICONS: Record<CandidateRarity, typeof Star> = {
  common: User,
  uncommon: Star,
  rare: Sparkles,
  legendary: Crown,
};

export function MarketPanel() {
  const { business, player, hireFromMarket } = useGameStore();
  const { t } = useI18n();
  const candidates = business.employeeMarket;
  const weeksUntilRefresh = Math.max(0, business.marketRefreshWeek + 4 - player.currentWeek);

  return (
    <Card className="p-4">
      <div className="flex items-center justify-between mb-4">
        <CardTitle className="flex items-center gap-2 text-base">
          <ShoppingBag className="w-4 h-4 text-purple-400" />
          Employee Market
        </CardTitle>
        <Badge variant="info" className="text-xs">
          Refreshes in {weeksUntilRefresh} weeks
        </Badge>
      </div>

      {candidates.length === 0 ? (
        <p className="text-sm text-zinc-500 text-center py-6">No candidates available. Wait for market refresh.</p>
      ) : (
        <div className="space-y-3">
          {candidates.map(c => {
            const style = RARITY_STYLES[c.rarity];
            const Icon = RARITY_ICONS[c.rarity];
            const traitDef = c.trait ? TRAITS.find(t => t.id === c.trait) : null;
            const canAfford = player.money >= c.hireCost;

            return (
              <div
                key={c.id}
                className={`rounded-lg border p-3 ${style.bg} ${style.border}`}
              >
                <div className="flex items-start justify-between gap-3">
                  <div className="flex-1 min-w-0">
                    <div className="flex items-center gap-2 mb-1">
                      <Icon className={`w-3.5 h-3.5 ${style.text}`} />
                      <span className="font-medium text-sm text-zinc-100 truncate">{c.name}</span>
                      <Badge className={`text-[10px] ${style.text} ${style.bg}`}>{c.rarity}</Badge>
                    </div>
                    <div className="text-xs text-zinc-400 capitalize mb-1.5">{c.role}</div>
                    <div className="grid grid-cols-3 gap-x-3 gap-y-1 text-[11px]">
                      <div><span className="text-zinc-500">EXP:</span> <span className="text-zinc-300">{c.experience}</span></div>
                      <div><span className="text-zinc-500">Talent:</span> <span className="text-zinc-300">{Math.round(c.talent * 100)}%</span></div>
                      <div><span className="text-zinc-500">Resist:</span> <span className="text-zinc-300">{Math.round(c.burnoutResistance * 100)}%</span></div>
                      <div><span className="text-zinc-500">Salary:</span> <span className="text-zinc-300">{formatMoney(c.salary)}/w</span></div>
                      <div className="col-span-2">
                        {traitDef && (
                          <span className="text-amber-400" title={traitDef.description}>
                            ✦ {traitDef.name}
                          </span>
                        )}
                      </div>
                    </div>
                  </div>
                  <Button
                    size="sm"
                    variant={canAfford ? 'primary' : 'secondary'}
                    disabled={!canAfford}
                    onClick={() => hireFromMarket(c.id)}
                    className="shrink-0 text-xs"
                  >
                    Hire {formatMoney(c.hireCost)}
                  </Button>
                </div>
              </div>
            );
          })}
        </div>
      )}
    </Card>
  );
}
