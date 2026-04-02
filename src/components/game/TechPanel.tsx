'use client';

import { useGameStore } from '@/game/store';
import { useI18n } from '@/i18n';
import { techName, techDesc } from '@/i18n/game-text';
import { Card, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Badge } from '@/components/ui/badge';
import { formatMoney } from '@/lib/utils';
import { TECHNOLOGIES } from '@/game/data';
import { Cpu, Plus, Minus } from 'lucide-react';

export function TechPanel() {
  const { business, adoptTechnology, removeTechnology } = useGameStore();
  const { t } = useI18n();

  return (
    <Card>
      <CardTitle className="flex items-center gap-2 mb-4">
        <Cpu className="w-5 h-5 text-purple-400" />
        {t.technologies}
      </CardTitle>

      <div className="space-y-2">
        {TECHNOLOGIES.map(tech => {
          const adopted = business.technologies.includes(tech.id);
          const hasSynergy = tech.synergyWith.some(s => business.technologies.includes(s));

          return (
            <div
              key={tech.id}
              className={`rounded-lg p-3 border transition-all ${
                adopted
                  ? 'bg-purple-950/30 border-purple-700/50'
                  : 'bg-zinc-800/50 border-zinc-700/30'
              }`}
            >
              <div className="flex items-center justify-between mb-1">
                <div className="flex items-center gap-2">
                  <span className="text-sm font-medium text-zinc-200">{techName(tech.id, t, tech.name)}</span>
                  {adopted && <Badge variant="success">{t.active}</Badge>}
                  {!adopted && hasSynergy && <Badge variant="info">{t.synergy}!</Badge>}
                </div>
                {adopted ? (
                  <Button size="sm" variant="ghost" onClick={() => removeTechnology(tech.id)}>
                    <Minus className="w-3.5 h-3.5 text-red-400" />
                  </Button>
                ) : (
                  <Button
                    size="sm"
                    variant="secondary"
                    onClick={() => adoptTechnology(tech.id)}
                  >
                    <Plus className="w-3.5 h-3.5" />
                    {formatMoney(tech.cost)}
                  </Button>
                )}
              </div>
              <p className="text-xs text-zinc-400 mb-1.5">{techDesc(tech.id, t, tech.description)}</p>
              <div className="flex gap-1.5 flex-wrap">
                <Badge variant="success">+{(tech.qualityBonus * 100).toFixed(0)}% {t.qualityLabel}</Badge>
                <Badge variant="warning">+{(tech.complexityAdd * 100).toFixed(0)}% {t.complexityLabel}</Badge>
                {tech.synergyWith.length > 0 && (
                  <Badge variant="info">
                    {t.synergy}: {tech.synergyWith.map(s => techName(s, t, TECHNOLOGIES.find(tt => tt.id === s)?.name || s)).join(', ')}
                  </Badge>
                )}
              </div>
            </div>
          );
        })}
      </div>
    </Card>
  );
}
