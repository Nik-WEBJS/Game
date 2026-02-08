'use client';

import { useGameStore } from '@/game/store';
import { useI18n } from '@/i18n';
import { GameSpeed } from '@/game/types';
import { Pause, Play, FastForward, Zap } from 'lucide-react';

const SPEEDS: { speed: GameSpeed; icon: typeof Play; label: string }[] = [
  { speed: 0, icon: Pause, label: '⏸' },
  { speed: 1, icon: Play, label: '1x' },
  { speed: 2, icon: FastForward, label: '2x' },
  { speed: 3, icon: Zap, label: '3x' },
];

export function TimeControls() {
  const { player, setGameSpeed } = useGameStore();
  const { t } = useI18n();
  const currentSpeed = player.gameSpeed;

  const weekNum = player.currentWeek;
  const progress = Math.round(player.weekProgress * 100);

  return (
    <div className="flex items-center gap-2 bg-zinc-900/70 backdrop-blur-md rounded-full px-3 py-1.5 border border-zinc-700/40">
      {/* Week display */}
      <span className="text-xs text-zinc-300 font-semibold">{t.weekShort}{weekNum}</span>
      <div className="w-12 h-1.5 bg-zinc-700/60 rounded-full overflow-hidden">
        <div
          className="h-full bg-emerald-500 rounded-full transition-all duration-100"
          style={{ width: `${progress}%` }}
        />
      </div>

      {/* Divider */}
      <div className="w-px h-4 bg-zinc-600/40" />

      {/* Speed buttons */}
      <div className="flex gap-0.5">
        {SPEEDS.map(({ speed, icon: Icon, label }) => (
          <button
            key={speed}
            onClick={() => setGameSpeed(speed)}
            className={`w-7 h-7 rounded-full flex items-center justify-center transition-all ${
              currentSpeed === speed
                ? speed === 0
                  ? 'bg-red-500/30 text-red-400 ring-1 ring-red-500/40'
                  : 'bg-emerald-500/30 text-emerald-400 ring-1 ring-emerald-500/40'
                : 'text-zinc-500 hover:text-zinc-200 hover:bg-zinc-700/50'
            }`}
            title={label}
          >
            <Icon className="w-3.5 h-3.5" />
          </button>
        ))}
      </div>
    </div>
  );
}
