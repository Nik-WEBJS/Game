'use client';

import { useGameStore } from '@/game/store';
import { GameSpeed } from '@/game/types';
import { Pause, Play, FastForward, Zap } from 'lucide-react';

const SPEEDS: { speed: GameSpeed; icon: typeof Play; label: string }[] = [
  { speed: 0, icon: Pause, label: 'Pause' },
  { speed: 1, icon: Play, label: '1x' },
  { speed: 2, icon: FastForward, label: '2x' },
  { speed: 3, icon: Zap, label: '3x' },
];

export function TimeControls() {
  const { player, setGameSpeed } = useGameStore();
  const currentSpeed = player.gameSpeed;

  const weekNum = player.currentWeek;
  const progress = Math.round(player.weekProgress * 100);

  return (
    <div className="flex items-center gap-3">
      {/* Week display */}
      <div className="flex items-center gap-2">
        <span className="text-xs text-zinc-400 font-medium">Week {weekNum}</span>
        {/* Week progress bar */}
        <div className="w-16 h-1.5 bg-zinc-700/60 rounded-full overflow-hidden">
          <div
            className="h-full bg-emerald-500 rounded-full transition-all duration-100"
            style={{ width: `${progress}%` }}
          />
        </div>
      </div>

      {/* Speed buttons */}
      <div className="flex bg-zinc-800/80 rounded-lg border border-zinc-700/50 p-0.5">
        {SPEEDS.map(({ speed, icon: Icon, label }) => (
          <button
            key={speed}
            onClick={() => setGameSpeed(speed)}
            className={`flex items-center gap-1 px-2.5 py-1.5 rounded-md text-xs font-medium transition-all ${
              currentSpeed === speed
                ? speed === 0
                  ? 'bg-red-500/20 text-red-400 border border-red-500/30'
                  : 'bg-emerald-500/20 text-emerald-400 border border-emerald-500/30'
                : 'text-zinc-400 hover:text-zinc-200 hover:bg-zinc-700/50 border border-transparent'
            }`}
            title={label}
          >
            <Icon className="w-3.5 h-3.5" />
            {speed > 0 && <span>{label}</span>}
          </button>
        ))}
      </div>
    </div>
  );
}
