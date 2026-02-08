'use client';

import { useGameStore } from '@/game/store';
import { useI18n } from '@/i18n';
import { roleName } from '@/i18n/game-text';
import { Card, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Badge } from '@/components/ui/badge';
import { ProgressBar } from '@/components/ui/progress-bar';
import { formatMoney } from '@/lib/utils';
import { TeamRole, ZoneId } from '@/game/types';
import { ZONES, TRAITS } from '@/game/data-advanced';
import { Users, UserPlus, UserMinus, MapPin, Monitor } from 'lucide-react';

const ROLES: TeamRole[] = ['developer', 'manager', 'qa', 'security', 'marketing'];

export function TeamPanel() {
  const {
    business, hireTeamMember, fireTeamMember, canHireMember, getHireCost, assignEmployeeZone, assignEmployeeDesk,
  } = useGameStore();

  // Desks that are placed in the office
  const placedDesks = business.furniture.filter(f => f.type === 'desk' && f.position);
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
                <div className="flex items-center gap-2 flex-wrap">
                  <span className="text-sm font-medium text-zinc-200">{member.name}</span>
                  <Badge variant="info">{roleName(member.role, t)}</Badge>
                  {member.trait && (() => {
                    const traitDef = TRAITS.find(tr => tr.id === member.trait);
                    return traitDef ? (
                      <span className="text-[10px] text-amber-400" title={traitDef.description}>✦ {traitDef.name}</span>
                    ) : null;
                  })()}
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
              {/* Zone & Desk assignment */}
              <div className="flex items-center gap-3 mb-2 flex-wrap">
                <div className="flex items-center gap-1.5">
                  <MapPin className="w-3 h-3 text-zinc-500" />
                  <select
                    value={member.zoneId ?? ''}
                    onChange={(e) => assignEmployeeZone(member.id, (e.target.value || null) as ZoneId | null)}
                    className="text-xs bg-zinc-700/50 border border-zinc-600/50 rounded px-2 py-0.5 text-zinc-300 focus:outline-none focus:ring-1 focus:ring-emerald-500/50"
                  >
                    <option value="">{t.noZone}</option>
                    {ZONES.map(z => (
                      <option key={z.id} value={z.id}>{z.name}</option>
                    ))}
                  </select>
                </div>
                <div className="flex items-center gap-1.5">
                  <Monitor className="w-3 h-3 text-zinc-500" />
                  <select
                    value={member.deskId ?? ''}
                    onChange={(e) => assignEmployeeDesk(member.id, e.target.value || null)}
                    className="text-xs bg-zinc-700/50 border border-zinc-600/50 rounded px-2 py-0.5 text-zinc-300 focus:outline-none focus:ring-1 focus:ring-amber-500/50"
                  >
                    <option value="">{t.noDesk}</option>
                    {placedDesks.map(d => (
                      <option key={d.id} value={d.id} disabled={!!d.assignedEmployeeId && d.assignedEmployeeId !== member.id}>
                        {d.name} {d.assignedEmployeeId && d.assignedEmployeeId !== member.id ? `(${t.occupied})` : ''}
                      </option>
                    ))}
                  </select>
                </div>
                {member.talent > 0.6 && (
                  <span className="text-[10px] text-purple-400">{t.talent}: {Math.round(member.talent * 100)}%</span>
                )}
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
