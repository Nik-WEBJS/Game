'use client';

import { useEffect, useRef } from 'react';
import { useGameStore } from '@/game/store';

// Drives the real-time game loop using requestAnimationFrame
export function GameLoop() {
  const gameTick = useGameStore(s => s.gameTick);
  const phase = useGameStore(s => s.phase);
  const speed = useGameStore(s => s.player.gameSpeed);
  const rafRef = useRef<number>(0);
  const lastTimeRef = useRef<number>(0);

  useEffect(() => {
    if (phase !== 'playing' || speed === 0) {
      lastTimeRef.current = 0;
      return;
    }

    const loop = (time: number) => {
      if (lastTimeRef.current > 0) {
        const deltaSec = Math.min((time - lastTimeRef.current) / 1000, 0.1); // cap at 100ms
        if (deltaSec > 0) {
          gameTick(deltaSec);
        }
      }
      lastTimeRef.current = time;
      rafRef.current = requestAnimationFrame(loop);
    };

    rafRef.current = requestAnimationFrame(loop);
    return () => {
      cancelAnimationFrame(rafRef.current);
      lastTimeRef.current = 0;
    };
  }, [phase, speed, gameTick]);

  return null;
}
