'use client';

import { useGameStore } from '@/game/store';
import { useI18n } from '@/i18n';
import { roleName } from '@/i18n/game-text';
import { Card, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Badge } from '@/components/ui/badge';
import { ProgressBar } from '@/components/ui/progress-bar';
import { formatMoney } from '@/lib/utils';
import { TeamRole } from '@/game/types';
import { Users, UserPlus, UserMinus } from 'lucide-react';

const ROLES: TeamRole[] = ['developer', 'manager', 'qa', 'security', 'marketing'];

export function TeamPanel() {
  const {
    business, hireTeamMember, fireTeamMember, canHireMember, getHireCost,
  } = useGameStore();
  const { t } = useI18n();

  return (
    <Card>
      <CardTitle className="flex items-center gap-2 mb-4">
        <Users className="w-5 h-5 text-cyan-400" />
        {t.team} ({business.team.length})
      </CardTitle>

      {/* Hire buttons */}
      <div className="flex flex-wrap gap-2 mb-4">
        {ROLES.map(role => (
          <Button
            key={role}
            size="sm"
            variant="secondary"
            disabled={!canHireMember(role)}
            onClick={() => hireTeamMember(role)}
          >
            <UserPlus className="w-3.5 h-3.5" />
            {roleName(role, t)} ({formatMoney(getHireCost(role))})
          </Button>
        ))}
      </div>

      {/* Team members */}
      {business.team.length === 0 ? (
        <p className="text-zinc-500 text-sm text-center py-4">{t.noTeamYet}</p>
      ) : (
        <div className="space-y-3 max-h-[400px] overflow-y-auto pr-1">
          {business.team.map(member => (
            <div
              key={member.id}
              className="bg-zinc-800/50 rounded-lg p-3 border border-zinc-700/30"
            >
              <div className="flex items-center justify-between mb-2">
                <div>
                  <span className="text-sm font-medium text-zinc-200">{member.name}</span>
                  <Badge variant="info" className="ml-2">{roleName(member.role, t)}</Badge>
                </div>
                <div className="flex items-center gap-2">
                  <span className="text-xs text-zinc-400">{formatMoney(member.salary)}{t.perWeek}</span>
                  <Button
                    size="sm"
                    variant="ghost"
                    onClick={() => fireTeamMember(member.id)}
                    className="!p-1"
                  >
                    <UserMinus className="w-3.5 h-3.5 text-red-400" />
                  </Button>
                </div>
              </div>
              <div className="space-y-1.5">
                <ProgressBar
                  value={member.experience}
                  color="purple"
                  size="sm"
                  label={t.experience}
                  showValue
                />
                <ProgressBar
                  value={member.burnout}
                  color={member.burnout > 60 ? 'red' : member.burnout > 30 ? 'amber' : 'emerald'}
                  size="sm"
                  label={t.burnout}
                  showValue
                />
                <ProgressBar
                  value={member.morale}
                  color={member.morale > 60 ? 'emerald' : member.morale > 30 ? 'amber' : 'red'}
                  size="sm"
                  label={t.morale}
                  showValue
                />
              </div>
            </div>
          ))}
        </div>
      )}
    </Card>
  );
}
