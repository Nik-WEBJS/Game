'use client';

import { useGameStore } from '@/game/store';
import { SetupScreen } from './SetupScreen';
import { GameDashboard } from './GameDashboard';
import { GameEndScreen } from './GameEndScreen';

export function Game() {
  const { phase } = useGameStore();

  if (phase === 'setup') return <SetupScreen />;
  if (phase === 'won' || phase === 'lost') return <GameEndScreen />;
  return <GameDashboard />;
}
