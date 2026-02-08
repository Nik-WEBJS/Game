'use client';

import { useGameStore } from '@/game/store';
import { useI18n } from '@/i18n';
import { isoName, isoDesc } from '@/i18n/game-text';
import { Card, CardTitle, CardDescription } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Badge } from '@/components/ui/badge';
import { ProgressBar } from '@/components/ui/progress-bar';
import { formatMoney } from '@/lib/utils';
import { getNextStage, getStageCost } from '@/game/engines/iso';
import { ISOStage } from '@/game/types';
import { TranslationKeys } from '@/i18n/en';
import { ClipboardCheck, ArrowRight, CheckCircle2, Users, AlertTriangle } from 'lucide-react';

function localizedStageLabel(stage: ISOStage, t: TranslationKeys): string {
  const map: Record<ISOStage, string> = {
    none: t.notStarted,
    audit: t.audit,
    implementation: t.implementation,
    internal_check: t.internalCheck,
    certification: t.certification,
    maintenance: t.maintenance,
  };
  return map[stage] || stage;
}

export function ISOPanel() {
  const store = useGameStore();
  const { business, startISOProcess, advanceISOStage } = store;
  const { t } = useI18n();
  const managerCount = business.team.filter(m => m.role === 'manager' && m.status === 'office').length;
  const managersOnISO = business.isoStandards.some(iso => iso.currentStage !== 'none' && iso.currentStage !== 'maintenance');

  return (
    <Card>
      <CardTitle className="flex items-center gap-2 mb-4">
        <ClipboardCheck className="w-5 h-5 text-amber-400" />
        {t.isoStandards}
      </CardTitle>

      {/* Manager info banner */}
      <div className={`flex items-center gap-2 p-2.5 rounded-lg mb-4 text-xs border ${
        managerCount > 0
          ? managersOnISO
            ? 'bg-amber-500/10 border-amber-500/20 text-amber-300'
            : 'bg-zinc-800/40 border-zinc-700/20 text-zinc-400'
          : 'bg-red-500/10 border-red-500/20 text-red-300'
      }`}>
        {managerCount > 0 ? (
          <>
            <Users className="w-3.5 h-3.5" />
            <span>
              {managersOnISO
                ? `${managerCount} ${t.managersWorkingISO}`
                : `${managerCount} ${t.managersAvailable}`}
            </span>
          </>
        ) : (
          <>
            <AlertTriangle className="w-3.5 h-3.5" />
            <span>{t.isoRequiresManager}</span>
          </>
        )}
      </div>

      {business.isoStandards.map(iso => {
        const startResult = store.canStartISO(iso.id);
        const canStart = startResult.ok;
        const canAdvance = store.canAdvanceISO(iso.id);
        const nextStage = getNextStage(iso.currentStage);
        const nextCost = nextStage ? getStageCost(nextStage) : 0;

        return (
          <div key={iso.id} className="bg-zinc-800/50 rounded-lg p-4 border border-zinc-700/30">
            <div className="flex items-center justify-between mb-2">
              <div className="flex items-center gap-2">
                <span className="text-sm font-semibold text-zinc-200">{isoName(iso.id, t, iso.name)}</span>
                {iso.certified && (
                  <Badge variant="success">
                    <CheckCircle2 className="w-3 h-3 mr-1" />
                    {t.certified}
                  </Badge>
                )}
              </div>
              <Badge variant={iso.currentStage === 'none' ? 'default' : 'info'}>
                {localizedStageLabel(iso.currentStage, t)}
              </Badge>
            </div>

            <CardDescription className="mb-3">{isoDesc(iso.id, t, iso.description)}</CardDescription>

            {/* Stage progress */}
            {iso.currentStage !== 'none' && iso.currentStage !== 'maintenance' && (
              <div className="mb-3">
                <ProgressBar
                  value={iso.stageProgress}
                  color={iso.stageProgress >= 100 ? 'emerald' : 'blue'}
                  label={`${localizedStageLabel(iso.currentStage, t)}`}
                  showValue
                />
              </div>
            )}

            {/* Maintenance info */}
            {iso.currentStage === 'maintenance' && (
              <div className="mb-3 text-xs text-zinc-400">
                {t.maintenanceCostLabel}: {formatMoney(iso.maintenanceCost)}{t.perWeek}
                <span className="mx-2">|</span>
                {t.weeksMaintained}: {iso.turnsInMaintenance}
              </div>
            )}

            {/* Effects */}
            <div className="flex flex-wrap gap-1.5 mb-3">
              <Badge variant="success">-{(iso.stabilizationBonus * 100).toFixed(0)}% {t.riskReduction}</Badge>
              <Badge variant="info">+{iso.reputationBonus} {t.reputation}</Badge>
              <Badge variant="success">-{(iso.burnoutReduction * 100).toFixed(0)}% {t.burnoutReduction}</Badge>
            </div>

            {/* Actions */}
            {iso.currentStage === 'none' && (
              <div>
                <Button
                  size="sm"
                  disabled={!canStart}
                  onClick={() => startISOProcess(iso.id)}
                >
                  {t.startAudit} ({formatMoney(getStageCost('audit'))})
                </Button>
                {startResult.reason === 'no_manager' && (
                  <p className="text-xs text-red-400 mt-1">{t.isoRequiresManager}</p>
                )}
              </div>
            )}

            {canAdvance && nextStage && (
              <Button
                size="sm"
                onClick={() => advanceISOStage(iso.id)}
              >
                <ArrowRight className="w-3.5 h-3.5" />
                {t.advanceTo} {localizedStageLabel(nextStage, t)} ({formatMoney(nextCost)})
              </Button>
            )}

            {iso.currentStage !== 'none' && iso.currentStage !== 'maintenance' && !canAdvance && iso.stageProgress < 100 && (
              <p className="text-xs text-zinc-500">{t.inProgress}</p>
            )}
          </div>
        );
      })}
    </Card>
  );
}
