'use client';

import { useGameStore } from '@/game/store';
import { useI18n } from '@/i18n';
import { Button } from '@/components/ui/button';
import { Card } from '@/components/ui/card';
import { LangSwitcher } from '@/components/ui/lang-switcher';
import { formatMoney } from '@/lib/utils';
import { Trophy, Skull, RotateCcw } from 'lucide-react';

export function GameEndScreen() {
  const { phase, player, business, resetGame } = useGameStore();
  const { t } = useI18n();

  const isWin = phase === 'won';

  return (
    <div className="min-h-screen bg-zinc-950 flex items-center justify-center relative">
      <div className="absolute top-4 right-4">
        <LangSwitcher />
      </div>
      <Card className="max-w-lg w-full text-center p-8">
        <div className="mb-6">
          {isWin ? (
            <Trophy className="w-20 h-20 text-amber-400 mx-auto" />
          ) : (
            <Skull className="w-20 h-20 text-red-400 mx-auto" />
          )}
        </div>

        <h1 className={`text-3xl font-bold mb-2 ${isWin ? 'text-emerald-400' : 'text-red-400'}`}>
          {isWin ? t.victory : t.gameOver}
        </h1>

        <p className="text-zinc-400 mb-6">
          {isWin ? t.victoryMessage : t.defeatMessage}
        </p>

        <div className="grid grid-cols-2 gap-3 mb-6 text-sm">
          <div className="bg-zinc-800/50 rounded-lg p-3">
            <div className="text-zinc-400">{t.weeksSurvived}</div>
            <div className="text-xl font-bold text-zinc-200">{player.currentWeek}</div>
          </div>
          <div className="bg-zinc-800/50 rounded-lg p-3">
            <div className="text-zinc-400">{t.finalBalance}</div>
            <div className={`text-xl font-bold ${player.money >= 0 ? 'text-emerald-400' : 'text-red-400'}`}>
              {formatMoney(player.money)}
            </div>
          </div>
          <div className="bg-zinc-800/50 rounded-lg p-3">
            <div className="text-zinc-400">{t.reputation}</div>
            <div className="text-xl font-bold text-amber-400">{player.reputation}</div>
          </div>
          <div className="bg-zinc-800/50 rounded-lg p-3">
            <div className="text-zinc-400">{t.experience}</div>
            <div className="text-xl font-bold text-purple-400">{player.experience} {t.xp}</div>
          </div>
          <div className="bg-zinc-800/50 rounded-lg p-3">
            <div className="text-zinc-400">{t.teamSize}</div>
            <div className="text-xl font-bold text-cyan-400">{business.team.length}</div>
          </div>
          <div className="bg-zinc-800/50 rounded-lg p-3">
            <div className="text-zinc-400">{t.isoCertified}</div>
            <div className="text-xl font-bold text-amber-400">
              {business.isoStandards.filter(i => i.certified).length}
            </div>
          </div>
        </div>

        <Button size="lg" onClick={resetGame}>
          <RotateCcw className="w-4 h-4" />
          {t.playAgain}
        </Button>
      </Card>
    </div>
  );
}
