'use client';

import { useState } from 'react';
import { useGameStore } from '@/game/store';
import { useI18n } from '@/i18n';
import type { TranslationKeys } from '@/i18n/en';
import { roleName } from '@/i18n/game-text';
import { Card, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Badge } from '@/components/ui/badge';
import { ProgressBar } from '@/components/ui/progress-bar';
import { formatMoney } from '@/lib/utils';
import { ZoneId, FreelanceTaskType, TeamMember } from '@/game/types';
import { ZONES, TRAITS } from '@/game/data-advanced';
import { calculateOutsourcingReward } from '@/game/engines/freelance';
import { Users, UserMinus, MapPin, Monitor, Briefcase, FlaskConical, Undo2, AlertTriangle } from 'lucide-react';

function freelanceErrorMessage(reason: string | undefined, t: TranslationKeys): string {
  switch (reason) {
    case 'lastEmployee': return t.freelanceCantLast;
    case 'tooMuchBurnout': return t.freelanceCantBurnout;
    case 'crisisActive': return t.freelanceCantCrisis;
    case 'alreadyFreelance': return t.freelanceAlready;
    case 'pendingCounterOffer': return t.freelanceCantCounterOffer;
    default: return '';
  }
}

function FreelanceModal({ member, onClose }: { member: TeamMember; onClose: () => void }) {
  const { business, sendToFreelance, canSendFreelance } = useGameStore();
  const { t } = useI18n();
  const [taskType, setTaskType] = useState<FreelanceTaskType>('outsourcing');
  const [productId, setProductId] = useState<string>(business.companyProducts[0]?.id ?? '');

  const check = canSendFreelance(member.id);
  const reward = calculateOutsourcingReward(member);

  const errorMsg = !check.ok ? freelanceErrorMessage(check.reason, t) : null;

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

      {taskType === 'internal_help' && business.companyProducts.length > 0 && (
        <select
          value={productId}
          onChange={(e) => setProductId(e.target.value)}
          className="w-full text-xs bg-zinc-700/50 border border-zinc-600/50 rounded px-2 py-1 text-zinc-300 focus:outline-none focus:ring-1 focus:ring-cyan-500/50"
        >
          {business.companyProducts.map(product => (
            <option key={product.id} value={product.id}>{product.name} ({product.lifecycle})</option>
          ))}
        </select>
      )}

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

      <div className="flex gap-2">
        <Button size="sm" variant="secondary" onClick={onClose} className="flex-1 text-xs">
          X
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
    business,
    fireTeamMember,
    assignEmployeeZone,
    assignEmployeeDesk,
    recallFromFreelance,
    respondCounterOffer,
    getOfficeEnvironmentScore,
    canSendFreelance,
  } = useGameStore();
  const { t } = useI18n();
  const [freelanceModalId, setFreelanceModalId] = useState<string | null>(null);
  const officeEnvironment = getOfficeEnvironmentScore();

  const placedDesks = business.furniture.filter(item => item.type === 'desk' && item.position);

  return (
    <Card>
      <CardTitle className="flex items-center gap-2 mb-4">
        <Users className="w-5 h-5 text-cyan-400" />
        {t.team} ({business.team.length})
      </CardTitle>
      <div className="mb-3 rounded-lg border border-zinc-700/40 bg-zinc-900/30 p-2.5 text-xs text-zinc-400">
        {t.officeEnvironmentLabel}: <span className="text-zinc-100 font-medium">{officeEnvironment}/100</span>
      </div>

      {business.team.length === 0 ? (
        <p className="text-zinc-500 text-sm text-center py-4">{t.noTeamYet}</p>
      ) : (
        <div className="space-y-3 max-h-[400px] overflow-y-auto pr-1">
          {business.team.map(member => {
            const isFreelance = member.status === 'freelance';
            const task = member.freelanceTask;
            const weeksLeft = task ? Math.max(1, Math.ceil(task.durationWeeks * (1 - task.progress))) : 0;
            const freelanceCheck = canSendFreelance(member.id);

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
                      const traitDef = TRAITS.find(trait => trait.id === member.trait);
                      return traitDef ? (
                        <span className="text-[10px] text-amber-400" title={traitDef.description}>* {traitDef.name}</span>
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
                        {ZONES.map(zone => (
                          <option key={zone.id} value={zone.id}>{zone.name}</option>
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
                        {placedDesks.map(desk => (
                          <option key={desk.id} value={desk.id} disabled={!!desk.assignedEmployeeId && desk.assignedEmployeeId !== member.id}>
                            {desk.name} {desk.assignedEmployeeId && desk.assignedEmployeeId !== member.id ? `(${t.occupied})` : ''}
                          </option>
                        ))}
                      </select>
                    </div>
                    {member.talent > 0.6 && (
                      <span className="text-[10px] text-purple-400">{t.talent}: {Math.round(member.talent * 100)}%</span>
                    )}
                  </div>
                )}

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
                  <ProgressBar
                    value={Math.round((member.retentionRisk ?? 0) * 100)}
                    color={(member.retentionRisk ?? 0) > 0.65 ? 'red' : (member.retentionRisk ?? 0) > 0.4 ? 'amber' : 'emerald'}
                    size="sm"
                    label={t.retentionRiskLabel}
                    showValue
                  />
                  <div className="text-[11px] text-zinc-500">
                    {t.targetSalaryLabel}: <span className="text-zinc-300">{formatMoney(member.salaryTarget ?? member.salary)}{t.perWeek}</span>
                    {' | '}
                    {t.workplaceExpectationLabel}: <span className="text-zinc-300">{Math.round(member.workplaceExpectation ?? 50)}/100</span>
                  </div>
                </div>

                {member.pendingCounterOffer && !isFreelance && (
                  <div className="mt-2 rounded-md border border-amber-700/40 bg-amber-900/10 p-2">
                    <div className="text-[11px] text-amber-300 mb-1">
                      {t.counterOfferLabel}: {formatMoney(member.pendingCounterOffer.requestedSalary)}{t.perWeek}, {t.counterOfferDeadline(member.pendingCounterOffer.expiresWeek)}
                    </div>
                    <div className="flex items-center gap-1.5">
                      <Button
                        size="sm"
                        variant="primary"
                        className="text-[11px]"
                        onClick={() => respondCounterOffer(member.id, true)}
                      >
                        {t.counterOfferAcceptRaise}
                      </Button>
                      <Button
                        size="sm"
                        variant="secondary"
                        className="text-[11px]"
                        onClick={() => respondCounterOffer(member.id, false)}
                      >
                        {t.counterOfferLetGo}
                      </Button>
                    </div>
                  </div>
                )}

                {!isFreelance && (
                  <div className="mt-2">
                    {freelanceModalId === member.id ? (
                      <FreelanceModal member={member} onClose={() => setFreelanceModalId(null)} />
                    ) : (
                      <Button
                        size="sm"
                        variant="secondary"
                        onClick={() => setFreelanceModalId(member.id)}
                        disabled={!freelanceCheck.ok}
                        title={!freelanceCheck.ok ? freelanceErrorMessage(freelanceCheck.reason, t) : ''}
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
