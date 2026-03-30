'use client';

import { useMemo } from 'react';
import { useGameStore } from '@/game/store';
import { Card, CardTitle } from '@/components/ui/card';
import { Badge } from '@/components/ui/badge';
import { Button } from '@/components/ui/button';
import { CAMPAIGN_MILESTONES } from '@/game/data-competition';
import { MnaActionType } from '@/game/types';
import { formatMoney } from '@/lib/utils';
import { Flag, Target, Trophy, Users, Zap } from 'lucide-react';

const MNA_ACTIONS: Array<{ id: MnaActionType; label: string; short: string }> = [
  { id: 'buy_user_base', label: 'Buy User Base', short: 'Users' },
  { id: 'acquire_technology', label: 'Acquire Technology', short: 'Tech' },
  { id: 'acqui_hire', label: 'Acqui-Hire Team', short: 'Hire' },
  { id: 'brand_boost', label: 'Brand Boost', short: 'Brand' },
];

function mnaReason(reason?: string): string {
  switch (reason) {
    case 'competitor_not_found': return 'Competitor not found';
    case 'invalid_action': return 'Action unavailable';
    case 'not_enough_money': return 'Not enough money';
    case 'target_too_small': return 'Target audience too small';
    case 'no_technology_left': return 'No technology left to acquire';
    case 'no_office_capacity': return 'No office capacity for acqui-hire';
    default: return 'Unavailable';
  }
}

export function CompetitionPanel() {
  const {
    player,
    business,
    executeMnaAction,
    canExecuteMnaAction,
    getMnaActionCost,
  } = useGameStore();

  const competition = business.competition;
  const campaign = business.campaign;
  const competitors = useMemo(
    () => [...competition.competitors].sort((a, b) => b.users - a.users),
    [competition.competitors],
  );
  const activeMilestone = CAMPAIGN_MILESTONES.find(m => m.id === campaign.activeId) ?? null;
  const completedMilestones = CAMPAIGN_MILESTONES.filter(m => campaign.completedIds.includes(m.id));
  const totalUsers = Math.max(1, competition.lastWeek.totalUsers);

  return (
    <Card className="p-4">
      <CardTitle className="flex items-center gap-2 text-base mb-4">
        <Trophy className="w-4 h-4 text-amber-400" />
        Competition & Milestones
      </CardTitle>

      <div className="grid grid-cols-2 lg:grid-cols-4 gap-2 mb-4">
        <StatChip label="Player rank" value={`#${competition.lastWeek.playerRank}`} tone={competition.lastWeek.playerRank <= 2 ? 'success' : 'warning'} />
        <StatChip label="Market share" value={`${(competition.lastWeek.playerMarketShare * 100).toFixed(1)}%`} tone="info" />
        <StatChip label="Market pressure" value={`${(competition.lastWeek.marketPressure * 100).toFixed(1)}%`} tone={competition.lastWeek.marketPressure > 18 ? 'warning' : 'success'} />
        <StatChip label="Top rival" value={competition.lastWeek.topCompetitorName ?? 'N/A'} tone="default" />
      </div>

      <div className="rounded-lg border border-zinc-700/40 bg-zinc-800/30 p-3 mb-4">
        <div className="text-xs uppercase tracking-wider text-zinc-500 mb-2 flex items-center gap-1">
          <Users className="w-3.5 h-3.5" />
          Ranking ladder
        </div>
        {competitors.length === 0 ? (
          <div className="text-sm text-zinc-500">No competitors generated yet. Start game with a niche selected.</div>
        ) : (
          <div className="space-y-2">
            <div className="rounded border border-zinc-600/50 bg-zinc-900/40 p-2.5">
              <div className="flex items-center justify-between text-sm">
                <span className="text-zinc-100 font-medium">{business.companyName} (You)</span>
                <span className="text-emerald-300">{competition.lastWeek.playerUsers.toLocaleString()} users</span>
              </div>
              <div className="text-[11px] text-zinc-500">
                Share {(competition.lastWeek.playerMarketShare * 100).toFixed(1)}%
              </div>
            </div>
            {competitors.map((competitor, index) => (
              <div key={competitor.id} className="rounded border border-zinc-700/40 bg-zinc-900/40 p-2.5">
                <div className="flex items-center justify-between">
                  <div>
                    <div className="text-sm text-zinc-100">#{index + 1} {competitor.name}</div>
                    <div className="text-[11px] text-zinc-500">
                      {competitor.users.toLocaleString()} users | share {((competitor.users / totalUsers) * 100).toFixed(1)}% | growth {(competitor.growth * 100).toFixed(1)}%
                    </div>
                  </div>
                  <Badge variant={competitor.pressure > 0.2 ? 'warning' : 'info'}>
                    Pressure {(competitor.pressure * 100).toFixed(0)}%
                  </Badge>
                </div>
                <div className="grid grid-cols-2 lg:grid-cols-4 gap-1.5 mt-2">
                  {MNA_ACTIONS.map((action) => {
                    const check = canExecuteMnaAction(action.id, competitor.id);
                    const cost = getMnaActionCost(action.id, competitor.id);
                    return (
                      <Button
                        key={action.id}
                        size="sm"
                        variant={check.ok ? 'primary' : 'secondary'}
                        disabled={!check.ok}
                        onClick={() => executeMnaAction(action.id, competitor.id)}
                        title={check.ok ? action.label : mnaReason(check.reason)}
                        className="text-[11px]"
                      >
                        {action.short} {cost == null ? '' : formatMoney(cost)}
                      </Button>
                    );
                  })}
                </div>
              </div>
            ))}
          </div>
        )}
      </div>

      <div className="rounded-lg border border-zinc-700/40 bg-zinc-800/30 p-3">
        <div className="text-xs uppercase tracking-wider text-zinc-500 mb-2 flex items-center gap-1">
          <Target className="w-3.5 h-3.5" />
          Guided progression
        </div>

        {activeMilestone ? (
          <div className="rounded border border-emerald-700/40 bg-emerald-950/20 p-2.5 mb-2">
            <div className="text-sm text-emerald-200 font-medium">{activeMilestone.title}</div>
            <div className="text-[11px] text-emerald-300/90">{activeMilestone.description}</div>
            <div className="text-[11px] text-emerald-300/80 mt-1">
              Reward: {formatMoney(activeMilestone.rewardMoney)} +{activeMilestone.rewardReputation} rep
            </div>
          </div>
        ) : (
          <div className="rounded border border-zinc-700/40 bg-zinc-900/40 p-2.5 mb-2 text-sm text-zinc-400">
            Campaign complete.
          </div>
        )}

        <div className="grid grid-cols-1 md:grid-cols-2 gap-1.5">
          {CAMPAIGN_MILESTONES.map((milestone) => {
            const done = campaign.completedIds.includes(milestone.id);
            const discovered = campaign.discoveredIds.includes(milestone.id);
            return (
              <div key={milestone.id} className={`rounded border p-2 text-xs ${done ? 'border-emerald-700/40 bg-emerald-950/15' : discovered ? 'border-zinc-700/40 bg-zinc-900/40' : 'border-zinc-800/40 bg-zinc-900/20 opacity-60'}`}>
                <div className="flex items-center justify-between">
                  <span className={done ? 'text-emerald-300' : 'text-zinc-300'}>{milestone.title}</span>
                  {done ? <Flag className="w-3.5 h-3.5 text-emerald-300" /> : <Zap className="w-3.5 h-3.5 text-zinc-500" />}
                </div>
                <div className="text-zinc-500 mt-0.5">{discovered ? milestone.description : 'Locked'}</div>
              </div>
            );
          })}
        </div>
        <div className="text-[11px] text-zinc-500 mt-2">
          Completed: {completedMilestones.length}/{CAMPAIGN_MILESTONES.length} | Reputation: {player.reputation}
        </div>
      </div>
    </Card>
  );
}

function StatChip({ label, value, tone }: { label: string; value: string; tone: 'default' | 'info' | 'warning' | 'success' }) {
  const toneCls = tone === 'success'
    ? 'border-emerald-700/40 bg-emerald-950/20 text-emerald-300'
    : tone === 'warning'
      ? 'border-amber-700/40 bg-amber-950/20 text-amber-300'
      : tone === 'info'
        ? 'border-blue-700/40 bg-blue-950/20 text-blue-300'
        : 'border-zinc-700/40 bg-zinc-900/40 text-zinc-300';
  return (
    <div className={`rounded border p-2.5 ${toneCls}`}>
      <div className="text-[11px] opacity-80">{label}</div>
      <div className="text-sm font-medium truncate">{value}</div>
    </div>
  );
}

