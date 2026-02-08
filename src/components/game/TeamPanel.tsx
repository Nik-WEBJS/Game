'use client';

import { useState } from 'react';
import { useGameStore } from '@/game/store';
import { useI18n } from '@/i18n';
import { roleName } from '@/i18n/game-text';
import { Card, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Badge } from '@/components/ui/badge';
import { ProgressBar } from '@/components/ui/progress-bar';
import { formatMoney } from '@/lib/utils';
import { TeamRole, ZoneId, FreelanceTaskType, TeamMember } from '@/game/types';
import { ZONES, TRAITS } from '@/game/data-advanced';
import { calculateOutsourcingReward } from '@/game/engines/freelance';
import { Users, UserPlus, UserMinus, MapPin, Monitor, Briefcase, FlaskConical, Undo2, AlertTriangle } from 'lucide-react';

const ROLES: TeamRole[] = ['developer', 'manager', 'qa', 'security', 'marketing'];

function FreelanceModal({ member, onClose }: { member: TeamMember; onClose: () => void }) {
  const { business, sendToFreelance, canSendFreelance } = useGameStore();
  const { t } = useI18n();
  const [taskType, setTaskType] = useState<FreelanceTaskType>('outsourcing');
  const [productId, setProductId] = useState<string>(business.companyProducts[0]?.id ?? '');

  const check = canSendFreelance(member.id);
  const reward = calculateOutsourcingReward(member);

  const errorMsg = !check.ok
    ? check.reason === 'lastEmployee' ? t.freelanceCantLast
    : check.reason === 'tooMuchBurnout' ? t.freelanceCantBurnout
    : check.reason === 'crisisActive' ? t.freelanceCantCrisis
    : check.reason === 'alreadyFreelance' ? t.freelanceAlready
    : ''
    : null;

  const handleSend = () => {
    if (!check.ok) return;
    sendToFreelance(member.id, taskType, taskType === 'internal_help' ? productId : undefined);
    onClose();
  };

  return (
    <div className="mt-2 rounded-lg bg-zinc-900/60 border border-violet-500/30 p-3 space-y-3">
      <div className="flex items-center gap-2 text-xs font-semibold text-violet-400">
        <Briefcase className="w-3.5 h-3.5" />
        {t.freelanceSend}
      </div>

      {errorMsg && (
        <div className="flex items-center gap-1.5 text-[11px] text-red-400 bg-red-900/20 rounded px-2 py-1">
          <AlertTriangle className="w-3 h-3" />
          {errorMsg}
        </div>
      )}

      {/* Task type selector */}
      <div className="flex gap-2">
        <button
          onClick={() => setTaskType('outsourcing')}
          className={`flex-1 flex items-center justify-center gap-1.5 px-2 py-1.5 rounded-md text-xs font-medium transition-all border ${
            taskType === 'outsourcing'
              ? 'bg-amber-600/20 border-amber-500/40 text-amber-300'
              : 'bg-zinc-800/50 border-zinc-700/30 text-zinc-400 hover:text-zinc-200'
          }`}
        >
          <Briefcase className="w-3 h-3" />
          {t.freelanceOutsourcing}
        </button>
        <button
          onClick={() => setTaskType('internal_help')}
          className={`flex-1 flex items-center justify-center gap-1.5 px-2 py-1.5 rounded-md text-xs font-medium transition-all border ${
            taskType === 'internal_help'
              ? 'bg-cyan-600/20 border-cyan-500/40 text-cyan-300'
              : 'bg-zinc-800/50 border-zinc-700/30 text-zinc-400 hover:text-zinc-200'
          }`}
          disabled={business.companyProducts.length === 0}
        >
          <FlaskConical className="w-3 h-3" />
          {t.freelanceInternalHelp}
        </button>
      </div>

      {/* Product selector for internal_help */}
      {taskType === 'internal_help' && business.companyProducts.length > 0 && (
        <select
          value={productId}
          onChange={(e) => setProductId(e.target.value)}
          className="w-full text-xs bg-zinc-700/50 border border-zinc-600/50 rounded px-2 py-1 text-zinc-300 focus:outline-none focus:ring-1 focus:ring-cyan-500/50"
        >
          {business.companyProducts.map(p => (
            <option key={p.id} value={p.id}>{p.name} ({p.lifecycle})</option>
          ))}
        </select>
      )}

      {/* Info */}
      <div className="text-[11px] text-zinc-400 space-y-1">
        {taskType === 'outsourcing' && (
          <div>{t.freelanceExpectedReward}: <span className="text-amber-400 font-semibold">{formatMoney(reward)}</span></div>
        )}
        {taskType === 'internal_help' && (
          <div>{t.freelanceExpectedEffect}: <span className="text-cyan-400 font-semibold">+0.6% {t.qualityLabel}/{t.weekShort}</span></div>
        )}
        <div className="flex items-center gap-1 text-amber-500">
          <AlertTriangle className="w-3 h-3" />
          {t.freelanceBurnoutWarning}
        </div>
      </div>

      {/* Actions */}
      <div className="flex gap-2">
        <Button size="sm" variant="secondary" onClick={onClose} className="flex-1 text-xs">
          ✕
        </Button>
        <Button
          size="sm"
          variant="primary"
          disabled={!check.ok || (taskType === 'internal_help' && !productId)}
          onClick={handleSend}
          className="flex-1 text-xs"
        >
          {t.freelanceSend}
        </Button>
      </div>
    </div>
  );
}

export function TeamPanel() {
  const {
    business, hireTeamMember, fireTeamMember, canHireMember, getHireCost,
    assignEmployeeZone, assignEmployeeDesk, recallFromFreelance,
  } = useGameStore();
  const [freelanceModalId, setFreelanceModalId] = useState<string | null>(null);

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
          {business.team.map(member => {
            const isFreelance = member.status === 'freelance';
            const task = member.freelanceTask;
            const weeksLeft = task ? Math.max(1, Math.ceil(task.durationWeeks * (1 - task.progress))) : 0;

            return (
              <div
                key={member.id}
                className={`rounded-lg p-3 border transition-colors ${
                  isFreelance
                    ? 'bg-violet-900/15 border-violet-700/30'
                    : 'bg-zinc-800/50 border-zinc-700/30'
                }`}
              >
                <div className="flex items-center justify-between mb-2">
                  <div className="flex items-center gap-2 flex-wrap">
                    <span className="text-sm font-medium text-zinc-200">{member.name}</span>
                    <Badge variant="info">{roleName(member.role, t)}</Badge>
                    <Badge variant="default" className="text-[10px]">Lv{member.level}</Badge>
                    {isFreelance && (
                      <Badge variant="warning" className="text-[10px]">
                        <Briefcase className="w-2.5 h-2.5 mr-0.5" />
                        {t.freelance}
                      </Badge>
                    )}
                    {member.trait && (() => {
                      const traitDef = TRAITS.find(tr => tr.id === member.trait);
                      return traitDef ? (
                        <span className="text-[10px] text-amber-400" title={traitDef.description}>✦ {traitDef.name}</span>
                      ) : null;
                    })()}
                  </div>
                  <div className="flex items-center gap-2">
                    <span className="text-xs text-zinc-400">{formatMoney(member.salary)}{t.perWeek}</span>
                    {!isFreelance && (
                      <Button
                        size="sm"
                        variant="ghost"
                        onClick={() => fireTeamMember(member.id)}
                        className="!p-1"
                      >
                        <UserMinus className="w-3.5 h-3.5 text-red-400" />
                      </Button>
                    )}
                  </div>
                </div>

                {/* Freelance progress */}
                {isFreelance && task && (
                  <div className="mb-2 space-y-1">
                    <div className="flex items-center justify-between text-[11px]">
                      <span className="text-violet-400 font-medium">
                        {t.freelanceWorking}: {task.type === 'outsourcing' ? t.freelanceOutsourcing : t.freelanceInternalHelp}
                      </span>
                      <span className="text-zinc-400">{t.freelanceWeeksLeft(weeksLeft)}</span>
                    </div>
                    <ProgressBar
                      value={Math.round(task.progress * 100)}
                      color="purple"
                      size="sm"
                      label={t.freelanceProgress}
                      showValue
                    />
                    {task.type === 'outsourcing' && (
                      <div className="text-[10px] text-amber-400">
                        {t.freelanceExpectedReward}: {formatMoney(task.rewardMoney)}
                      </div>
                    )}
                    <Button
                      size="sm"
                      variant="ghost"
                      onClick={() => recallFromFreelance(member.id)}
                      className="text-[11px] text-zinc-400 hover:text-zinc-200 !p-1 gap-1"
                    >
                      <Undo2 className="w-3 h-3" />
                      {t.freelanceRecall}
                    </Button>
                  </div>
                )}

                {/* Zone & Desk assignment — only for office employees */}
                {!isFreelance && (
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
                )}

                {/* Stats */}
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

                {/* Freelance send button */}
                {!isFreelance && (
                  <div className="mt-2">
                    {freelanceModalId === member.id ? (
                      <FreelanceModal member={member} onClose={() => setFreelanceModalId(null)} />
                    ) : (
                      <Button
                        size="sm"
                        variant="secondary"
                        onClick={() => setFreelanceModalId(member.id)}
                        className="text-[11px] gap-1"
                      >
                        <Briefcase className="w-3 h-3" />
                        {t.freelanceSend}
                      </Button>
                    )}
                  </div>
                )}
              </div>
            );
          })}
        </div>
      )}
    </Card>
  );
}
