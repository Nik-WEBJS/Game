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
import { ClipboardCheck, ArrowRight, CheckCircle2 } from 'lucide-react';

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
  const {
    business, startISOProcess, advanceISOStage,
    canStartISO: checkCanStart, canAdvanceISO: checkCanAdvance,
  } = useGameStore();
  const { t } = useI18n();

  return (
    <Card>
      <CardTitle className="flex items-center gap-2 mb-4">
        <ClipboardCheck className="w-5 h-5 text-amber-400" />
        {t.isoStandards}
      </CardTitle>

      {business.isoStandards.map(iso => {
        const canStart = checkCanStart(iso.id);
        const canAdvance = checkCanAdvance(iso.id);
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
              <Button
                size="sm"
                disabled={!canStart}
                onClick={() => startISOProcess(iso.id)}
              >
                {t.startAudit} ({formatMoney(getStageCost('audit'))})
              </Button>
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
