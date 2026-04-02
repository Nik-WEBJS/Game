'use client';

import { useState } from 'react';
import { useGameStore } from '@/game/store';
import { Card, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Badge } from '@/components/ui/badge';
import { ProgressBar } from '@/components/ui/progress-bar';
import { formatMoney } from '@/lib/utils';
import { FUNDING_ROUND_ORDER, FUNDING_ROUND_LABEL } from '@/game/data-corporate';
import { FundingRoundId } from '@/game/types';
import { BALANCE } from '@/game/config/balance';
import { Landmark, LineChart, ShieldCheck } from 'lucide-react';
import { evaluateBoardGoal, getBoardGoalLabel } from '@/game/engines/corporate';

function roundReason(reason?: string): string {
  switch (reason) {
    case 'previous_round_required': return 'Raise previous round first';
    case 'already_raised': return 'Already raised';
    case 'too_early': return 'Too early for this round';
    case 'valuation_too_low': return 'Valuation requirement not met';
    case 'founder_equity_too_low': return 'Founder equity is too low';
    default: return 'Unavailable';
  }
}

function buybackReason(reason?: string): string {
  switch (reason) {
    case 'no_investor_equity': return 'No investor equity to buy back';
    default: return 'Unavailable';
  }
}

function offerReason(reason?: string): string {
  switch (reason) {
    case 'no_active_offer': return 'No active offer';
    case 'offer_expired': return 'Offer already expired';
    case 'previous_round_required': return 'Raise previous round first';
    case 'round_already_raised': return 'Round already raised';
    case 'valuation_too_low': return 'Valuation requirement not met';
    case 'founder_equity_too_low': return 'Founder equity is too low';
    default: return 'Unavailable';
  }
}

export function CorporatePanel() {
  const {
    player,
    business,
    getCompanyValuation,
    canRaiseFundingRound,
    raiseFundingRound,
    canAcceptInvestorOffer,
    acceptInvestorOffer,
    rejectInvestorOffer,
    getBuybackCost,
    canExecuteBuyback,
    executeBuyback,
  } = useGameStore();
  const [buybackPct, setBuybackPct] = useState(2);

  const corporate = business.corporate;
  const liveValuation = getCompanyValuation();
  const buybackFraction = Math.max(0.01, Math.min(0.1, buybackPct / 100));
  const buybackCost = getBuybackCost(buybackFraction);
  const buybackCheck = canExecuteBuyback(buybackFraction);
  const offerCheck = canAcceptInvestorOffer();
  const offer = corporate.activeOffer;

  return (
    <Card className="p-4">
      <CardTitle className="flex items-center gap-2 text-base mb-4">
        <Landmark className="w-4 h-4 text-amber-400" />
        Corporate & Investors
      </CardTitle>

      <div className="grid grid-cols-2 lg:grid-cols-4 gap-2 mb-4">
        <StatChip label="Valuation" value={formatMoney(liveValuation)} tone="info" />
        <StatChip label="Founder Equity" value={`${(corporate.founderEquity * 100).toFixed(1)}%`} tone="success" />
        <StatChip label="Investor Equity" value={`${(corporate.investorEquity * 100).toFixed(1)}%`} tone="warning" />
        <StatChip label="Cash Raised" value={formatMoney(corporate.cumulativeCashRaised)} tone="default" />
      </div>

      <div className="grid grid-cols-2 lg:grid-cols-4 gap-2 mb-4">
        <StatChip label="Goals Completed" value={`${corporate.goalsCompleted}`} tone="success" />
        <StatChip label="Goals Failed" value={`${corporate.goalsFailed}`} tone="warning" />
        <StatChip label="Next Goal Week" value={`W${corporate.nextGoalWeek}`} tone="default" />
        <StatChip label="Current Week" value={`W${player.currentWeek}`} tone="info" />
      </div>

      <div className="grid grid-cols-2 lg:grid-cols-4 gap-2 mb-4">
        <StatChip label="Offers Accepted" value={`${corporate.offersAccepted}`} tone="success" />
        <StatChip label="Offers Rejected" value={`${corporate.offersRejected}`} tone="warning" />
        <StatChip label="Offers Expired" value={`${corporate.offersExpired}`} tone="warning" />
        <StatChip label="Next Offer Week" value={`W${corporate.nextOfferWeek}`} tone="default" />
      </div>

      <div className="rounded-lg border border-zinc-700/40 bg-zinc-800/30 p-3 mb-4">
        <div className="text-xs uppercase tracking-wider text-zinc-500 mb-2">Investor Offer</div>
        {offer ? (
          <div className="space-y-2">
            <div className="text-sm text-zinc-100">
              {FUNDING_ROUND_LABEL[offer.roundId]}: {formatMoney(offer.cash)} for {(offer.equity * 100).toFixed(1)}% equity
            </div>
            <div className="grid grid-cols-1 md:grid-cols-2 gap-1.5 text-[11px]">
              <Badge variant="info">Expires: W{offer.expiresWeek}</Badge>
              <Badge variant="warning">Min valuation: {formatMoney(offer.minValuation)}</Badge>
            </div>
            <div className="flex items-center gap-2">
              <Button
                size="sm"
                variant={offerCheck.ok ? 'primary' : 'secondary'}
                disabled={!offerCheck.ok}
                onClick={() => acceptInvestorOffer()}
                title={offerCheck.ok ? '' : offerReason(offerCheck.reason)}
              >
                Accept offer
              </Button>
              <Button size="sm" variant="ghost" onClick={() => rejectInvestorOffer()}>
                Reject
              </Button>
            </div>
            {!offerCheck.ok && (
              <div className="text-[11px] text-amber-300">{offerReason(offerCheck.reason)}</div>
            )}
          </div>
        ) : (
          <div className="text-sm text-zinc-500">
            No active offer. Next investor outreach expected around W{corporate.nextOfferWeek}.
          </div>
        )}
      </div>

      <div className="rounded-lg border border-zinc-700/40 bg-zinc-800/30 p-3 mb-4">
        <div className="text-xs uppercase tracking-wider text-zinc-500 mb-2">Board Goal</div>
        {corporate.activeGoal ? (
          (() => {
            const goal = corporate.activeGoal;
            const goalEval = evaluateBoardGoal({ player, business }, goal);
            return (
              <div className="space-y-2">
                <div className="text-sm text-zinc-100">{getBoardGoalLabel(goal)}</div>
                <ProgressBar
                  value={Math.round(goalEval.progress * 100)}
                  color={goalEval.progress >= 1 ? 'emerald' : goalEval.progress >= 0.55 ? 'amber' : 'red'}
                  label={`${goalEval.currentText} / ${goalEval.targetText}`}
                  showValue
                />
                <div className="grid grid-cols-1 md:grid-cols-2 gap-1.5 text-[11px]">
                  <Badge variant="info">Due: W{goal.dueWeek}</Badge>
                  <Badge variant="success">Reward: {formatMoney(goal.rewardMoney)} +{goal.rewardReputation} rep</Badge>
                  <Badge variant="warning">Fail: -{goal.penaltyReputation} rep</Badge>
                  <Badge variant="warning">Pressure +{Math.round(goal.pressureIncrease * 100)}%</Badge>
                </div>
              </div>
            );
          })()
        ) : (
          <div className="text-sm text-zinc-500">
            {corporate.investorEquity >= BALANCE.corporate.boardGoals.minInvestorEquityToActivate
              ? `No active goal. Next assignment expected around W${corporate.nextGoalWeek}.`
              : `Board goals unlock after investor equity reaches ${(BALANCE.corporate.boardGoals.minInvestorEquityToActivate * 100).toFixed(0)}%+.`
            }
          </div>
        )}
      </div>

      <div className="rounded-lg border border-zinc-700/40 bg-zinc-800/30 p-3 mb-4">
        <div className="text-xs uppercase tracking-wider text-zinc-500 mb-2 flex items-center gap-1">
          <LineChart className="w-3.5 h-3.5" />
          Board Pressure
        </div>
        <ProgressBar
          value={Math.round(corporate.boardPressure * 100)}
          color={corporate.boardPressure > 0.55 ? 'red' : corporate.boardPressure > 0.3 ? 'amber' : 'emerald'}
          label="Pressure"
          showValue
        />
        <div className="text-[11px] text-zinc-500 mt-2">
          Pressure rises with high investor share, weak growth, negative profit and high churn.
        </div>
      </div>

      <div className="rounded-lg border border-zinc-700/40 bg-zinc-800/30 p-3 mb-4">
        <div className="text-xs uppercase tracking-wider text-zinc-500 mb-2">Funding Rounds</div>
        <div className="space-y-2">
          {FUNDING_ROUND_ORDER.map((roundId) => (
            <FundingRoundRow
              key={roundId}
              roundId={roundId}
              currentWeek={player.currentWeek}
              valuation={liveValuation}
              raised={corporate.rounds.find((r) => r.id === roundId)?.raised ?? false}
              weekRaised={corporate.rounds.find((r) => r.id === roundId)?.weekRaised ?? null}
              canRaise={canRaiseFundingRound(roundId)}
              onRaise={() => raiseFundingRound(roundId)}
            />
          ))}
        </div>
      </div>

      <div className="rounded-lg border border-zinc-700/40 bg-zinc-800/30 p-3">
        <div className="text-xs uppercase tracking-wider text-zinc-500 mb-2 flex items-center gap-1">
          <ShieldCheck className="w-3.5 h-3.5" />
          Buyback
        </div>
        <div className="flex items-center gap-2 mb-2">
          <input
            type="number"
            min={1}
            max={10}
            value={buybackPct}
            onChange={(e) => setBuybackPct(Math.max(1, Math.min(10, Math.round(Number(e.target.value || 1)))))}
            className="w-20 bg-zinc-900 border border-zinc-700 rounded px-2 py-1 text-xs text-zinc-200"
          />
          <Badge variant="info">Cost: {formatMoney(buybackCost)}</Badge>
          <Button
            size="sm"
            variant={buybackCheck.ok ? 'primary' : 'secondary'}
            disabled={!buybackCheck.ok}
            onClick={() => executeBuyback(buybackFraction)}
            title={buybackCheck.ok ? '' : buybackReason(buybackCheck.reason)}
          >
            Buy back {buybackPct}%
          </Button>
        </div>
        {!buybackCheck.ok && (
          <div className="text-[11px] text-zinc-500">{buybackReason(buybackCheck.reason)}</div>
        )}
      </div>
    </Card>
  );
}

function FundingRoundRow({
  roundId,
  currentWeek,
  valuation,
  raised,
  weekRaised,
  canRaise,
  onRaise,
}: {
  roundId: FundingRoundId;
  currentWeek: number;
  valuation: number;
  raised: boolean;
  weekRaised: number | null;
  canRaise: { ok: boolean; reason?: string };
  onRaise: () => void;
}) {
  const def = BALANCE.corporate.rounds[roundId];
  return (
    <div className="rounded border border-zinc-700/40 bg-zinc-900/40 p-2.5">
      <div className="flex items-center justify-between gap-2 mb-1">
        <div className="text-sm text-zinc-100">
          {FUNDING_ROUND_LABEL[roundId]}
          {raised && weekRaised != null ? <span className="text-zinc-500 text-xs"> (W{weekRaised})</span> : null}
        </div>
        {raised ? (
          <Badge variant="success">Raised</Badge>
        ) : (
          <Button
            size="sm"
            variant={canRaise.ok ? 'primary' : 'secondary'}
            disabled={!canRaise.ok}
            onClick={onRaise}
            title={canRaise.ok ? '' : roundReason(canRaise.reason)}
          >
            Raise {formatMoney(def.cash)}
          </Button>
        )}
      </div>
      <div className="text-[11px] text-zinc-500">
        Requires W{def.minWeek}+ and valuation {formatMoney(def.minValuation)}.
        Dilution: {(def.equity * 100).toFixed(1)}%.
      </div>
      {!raised && (!canRaise.ok || currentWeek < def.minWeek || valuation < def.minValuation) && (
        <div className="text-[11px] text-amber-300 mt-0.5">{roundReason(canRaise.reason)}</div>
      )}
    </div>
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
