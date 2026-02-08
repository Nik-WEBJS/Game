'use client';

import { useGameStore } from '@/game/store';
import { useI18n } from '@/i18n';
import { Card, CardTitle } from '@/components/ui/card';
import { cn } from '@/lib/utils';
import { ScrollText } from 'lucide-react';
import { useRef, useEffect } from 'react';

const typeColors: Record<string, string> = {
  info: 'text-zinc-400',
  warning: 'text-amber-400',
  success: 'text-emerald-400',
  danger: 'text-red-400',
  event: 'text-cyan-400',
};

export function EventLog() {
  const { logs } = useGameStore();
  const { t } = useI18n();
  const scrollRef = useRef<HTMLDivElement>(null);

  useEffect(() => {
    if (scrollRef.current) {
      scrollRef.current.scrollTop = scrollRef.current.scrollHeight;
    }
  }, [logs.length]);

  const recentLogs = logs.slice(-50);

  return (
    <Card>
      <CardTitle className="flex items-center gap-2 mb-3">
        <ScrollText className="w-5 h-5 text-zinc-400" />
        {t.eventLog}
      </CardTitle>

      <div
        ref={scrollRef}
        className="space-y-1 max-h-[300px] overflow-y-auto pr-1 scrollbar-thin"
      >
        {recentLogs.map((log, i) => (
          <div key={i} className="flex gap-2 text-xs py-0.5">
            <span className="text-zinc-600 shrink-0 w-10 text-right">W{log.week}</span>
            <span className={cn(typeColors[log.type] || 'text-zinc-400')}>
              {log.message}
            </span>
          </div>
        ))}
      </div>
    </Card>
  );
}
