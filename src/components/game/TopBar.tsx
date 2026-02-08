'use client';

import { useGameStore } from '@/game/store';
import { useI18n } from '@/i18n';
import { Badge } from '@/components/ui/badge';
import { LangSwitcher } from '@/components/ui/lang-switcher';
import { formatMoney } from '@/lib/utils';
import { DollarSign, Star, Brain, Calendar } from 'lucide-react';

export function TopBar() {
  const { player, business } = useGameStore();
  const { t } = useI18n();

  return (
    <div className="bg-zinc-900/90 border-b border-zinc-700/50 backdrop-blur-sm sticky top-0 z-50">
      <div className="max-w-[1600px] mx-auto px-4 py-3 flex items-center justify-between">
        <h1 className="text-xl font-bold bg-gradient-to-r from-emerald-400 to-cyan-400 bg-clip-text text-transparent">
          {t.businessTycoon}
        </h1>

        <div className="flex items-center gap-4">
          <div className="flex items-center gap-1.5">
            <Calendar className="w-4 h-4 text-zinc-400" />
            <span className="text-sm text-zinc-300">{t.week} {player.currentWeek}</span>
          </div>

          <div className="flex items-center gap-1.5">
            <DollarSign className="w-4 h-4 text-emerald-400" />
            <span className={`text-sm font-semibold ${player.money >= 0 ? 'text-emerald-400' : 'text-red-400'}`}>
              {formatMoney(player.money)}
            </span>
          </div>

          <div className="flex items-center gap-1.5">
            <Star className="w-4 h-4 text-amber-400" />
            <span className="text-sm text-amber-300">{player.reputation}</span>
          </div>

          <div className="flex items-center gap-1.5">
            <Brain className="w-4 h-4 text-purple-400" />
            <span className="text-sm text-purple-300">{player.experience} {t.xp}</span>
          </div>

          {business.metrics.profit !== 0 && (
            <Badge variant={business.metrics.profit > 0 ? 'success' : 'danger'}>
              {business.metrics.profit > 0 ? '+' : ''}{formatMoney(business.metrics.profit)}{t.perWeek}
            </Badge>
          )}

          <LangSwitcher />
        </div>
      </div>
    </div>
  );
}
