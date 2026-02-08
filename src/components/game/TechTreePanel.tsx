'use client';

import { useGameStore } from '@/game/store';
import { useI18n } from '@/i18n';
import { Card, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Badge } from '@/components/ui/badge';
import { ProgressBar } from '@/components/ui/progress-bar';
import { formatMoney } from '@/lib/utils';
import { GitBranch, Megaphone, Lock, FlaskConical, Check, Settings } from 'lucide-react';
import { TechBranch } from '@/game/types';
import { ttNodeName, ttNodeDesc } from '@/i18n/game-text';

const BRANCH_META: Record<TechBranch, { labelKey: string; color: string; icon: typeof GitBranch }> = {
  tech_core: { labelKey: 'techCore', color: 'text-cyan-400', icon: GitBranch },
  marketing_influence: { labelKey: 'marketingInfluence', color: 'text-purple-400', icon: Megaphone },
  operations_process: { labelKey: 'operationsProcess', color: 'text-amber-400', icon: Settings },
};

export function TechTreePanel() {
  const { business, player, startResearch } = useGameStore();
  const { t } = useI18n();
  const tree = business.techTree;
  const isResearching = tree.some(n => n.researching);

  const branches: TechBranch[] = ['tech_core', 'marketing_influence', 'operations_process'];

  return (
    <Card className="p-4">
      <CardTitle className="flex items-center gap-2 text-base mb-4">
        <FlaskConical className="w-4 h-4 text-cyan-400" />
        {t.researchTree}
      </CardTitle>

      <div className="space-y-6">
        {branches.map(branchId => {
          const meta = BRANCH_META[branchId];
          const BranchIcon = meta.icon;
          const nodes = tree.filter(n => n.branch === branchId);

          return (
            <div key={branchId}>
              <h3 className={`text-sm font-semibold mb-3 flex items-center gap-2 ${meta.color}`}>
                <BranchIcon className="w-3.5 h-3.5" />
                {(t as any)[meta.labelKey]}
              </h3>
              <div className="space-y-2">
                {nodes.map(node => {
                  const canStart = node.unlocked && !node.completed && !node.researching && !isResearching
                    && player.money >= node.cost
                    && (!node.requiredReputation || player.reputation >= node.requiredReputation);

                  return (
                    <div
                      key={node.id}
                      className={`rounded-lg border p-3 transition-colors ${
                        node.completed
                          ? 'bg-emerald-900/20 border-emerald-700/40'
                          : node.researching
                            ? 'bg-cyan-900/20 border-cyan-700/40'
                            : node.unlocked
                              ? 'bg-zinc-800/50 border-zinc-700/50'
                              : 'bg-zinc-900/30 border-zinc-800/30 opacity-50'
                      }`}
                    >
                      <div className="flex items-start justify-between gap-3">
                        <div className="flex-1 min-w-0">
                          <div className="flex items-center gap-2 mb-1">
                            {node.completed ? (
                              <Check className="w-3.5 h-3.5 text-emerald-400" />
                            ) : !node.unlocked ? (
                              <Lock className="w-3.5 h-3.5 text-zinc-500" />
                            ) : null}
                            <span className="font-medium text-sm text-zinc-100">{ttNodeName(node.id, t, node.name)}</span>
                            {node.completed && <Badge variant="success" className="text-[10px]">{t.done}</Badge>}
                            {node.researching && <Badge variant="info" className="text-[10px]">{t.researching}</Badge>}
                          </div>
                          <p className="text-[11px] text-zinc-400 mb-1.5">{ttNodeDesc(node.id, t, node.description)}</p>

                          {node.researching && (
                            <ProgressBar
                              value={node.researchProgress}
                              max={100}
                              color="cyan"
                              className="mb-1"
                            />
                          )}

                          <div className="flex gap-3 text-[11px] text-zinc-500">
                            <span>{t.cost}: {formatMoney(node.cost)}</span>
                            <span>{t.weeksShort(node.weeksToResearch)}</span>
                            {node.requiredReputation && (
                              <span className={player.reputation >= node.requiredReputation ? 'text-emerald-400' : 'text-red-400'}>
                                {t.repRequired(node.requiredReputation)}
                              </span>
                            )}
                          </div>

                          {node.completed && Object.entries(node.effects).length > 0 && (
                            <div className="flex gap-2 mt-1.5 flex-wrap">
                              {Object.entries(node.effects).map(([k, v]) => (
                                <span key={k} className="text-[10px] text-emerald-400">
                                  {k.replace('Mod', '')}: {v > 0 ? '+' : ''}{Math.round((v as number) * 100)}%
                                </span>
                              ))}
                            </div>
                          )}
                        </div>

                        {!node.completed && node.unlocked && !node.researching && (
                          <Button
                            size="sm"
                            variant={canStart ? 'primary' : 'secondary'}
                            disabled={!canStart}
                            onClick={() => startResearch(node.id)}
                            className="shrink-0 text-xs"
                          >
                            {t.research}
                          </Button>
                        )}
                      </div>
                    </div>
                  );
                })}
              </div>
            </div>
          );
        })}
      </div>
    </Card>
  );
}
