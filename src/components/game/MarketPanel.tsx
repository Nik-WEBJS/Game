'use client';

import { useState } from 'react';
import { useGameStore } from '@/game/store';
import { useI18n } from '@/i18n';
import type { TranslationKeys } from '@/i18n/en';
import { roleName } from '@/i18n/game-text';
import { Card, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Badge } from '@/components/ui/badge';
import { formatMoney } from '@/lib/utils';
import { ShoppingBag, Star, Sparkles, Crown, User, Code2, Briefcase, Shield, Megaphone, ClipboardCheck } from 'lucide-react';
import { CandidateRarity, TeamRole } from '@/game/types';
import { TRAITS } from '@/game/data-advanced';

const RARITY_STYLES: Record<CandidateRarity, { bg: string; text: string; border: string }> = {
  common: { bg: 'bg-zinc-700/50', text: 'text-zinc-300', border: 'border-zinc-600/50' },
  uncommon: { bg: 'bg-emerald-900/30', text: 'text-emerald-400', border: 'border-emerald-700/50' },
  rare: { bg: 'bg-blue-900/30', text: 'text-blue-400', border: 'border-blue-700/50' },
  legendary: { bg: 'bg-amber-900/30', text: 'text-amber-400', border: 'border-amber-700/50' },
};

const RARITY_ICONS: Record<CandidateRarity, typeof Star> = {
  common: User,
  uncommon: Star,
  rare: Sparkles,
  legendary: Crown,
};

const ROLE_TAB_ICONS: Record<TeamRole, typeof Code2> = {
  developer: Code2,
  manager: Briefcase,
  qa: ClipboardCheck,
  security: Shield,
  marketing: Megaphone,
};

const ROLE_TAB_COLORS: Record<TeamRole, string> = {
  developer: 'from-blue-500 to-blue-700',
  manager: 'from-amber-500 to-amber-700',
  qa: 'from-emerald-500 to-emerald-700',
  security: 'from-red-500 to-red-700',
  marketing: 'from-purple-500 to-purple-700',
};

const ROLES_ORDER: TeamRole[] = ['developer', 'manager', 'qa', 'security', 'marketing'];
const RARITY_TRANSLATION_KEY: Record<CandidateRarity, string> = {
  common: 'common',
  uncommon: 'uncommon',
  rare: 'rare',
  legendary: 'legendary',
};

function offerReason(reason: string | undefined, t: TranslationKeys): string {
  switch (reason) {
    case 'salary_below_min': return t.marketOfferReasonSalaryBelowMin;
    case 'office_full': return t.marketOfferReasonOfficeFull;
    case 'candidate_not_found': return t.marketOfferReasonCandidateGone;
    default: return t.marketOfferReasonUnavailable;
  }
}

export function MarketPanel() {
  const { business, player, makeCandidateOffer, evaluateCandidateOffer } = useGameStore();
  const { t } = useI18n();
  const [activeRole, setActiveRole] = useState<TeamRole>('developer');
  const [offerByCandidate, setOfferByCandidate] = useState<Record<string, number>>({});
  const candidates = business.employeeMarket;
  const weeksUntilRefresh = Math.max(0, business.marketRefreshWeek + 4 - player.currentWeek);
  const roleCandidates = candidates.filter(c => c.role === activeRole);

  return (
    <Card className="p-4">
      <div className="flex items-center justify-between mb-4">
        <CardTitle className="flex items-center gap-2 text-base">
          <ShoppingBag className="w-4 h-4 text-purple-400" />
          {t.employeeMarket}
        </CardTitle>
        <div className="flex items-center gap-2">
          <Badge variant="default" className="text-[10px]">
            {t.repRequired(player.reputation)} {t.reputation}
          </Badge>
          <Badge variant="info" className="text-xs">
            {t.refreshesIn(weeksUntilRefresh)}
          </Badge>
        </div>
      </div>

      <div className="flex gap-1.5 mb-4">
        {ROLES_ORDER.map(role => {
          const Icon = ROLE_TAB_ICONS[role];
          const isActive = activeRole === role;
          const count = candidates.filter(c => c.role === role).length;
          return (
            <button
              key={role}
              onClick={() => setActiveRole(role)}
              className={`flex-1 flex flex-col items-center gap-1 py-2 px-1 rounded-lg transition-all border text-center ${
                isActive
                  ? `bg-gradient-to-br ${ROLE_TAB_COLORS[role]} border-white/20 shadow-lg`
                  : 'bg-zinc-800/50 border-zinc-700/30 hover:border-zinc-500/50 hover:bg-zinc-700/40'
              }`}
            >
              <Icon className={`w-4 h-4 ${isActive ? 'text-white' : 'text-zinc-400'}`} />
              <span className={`text-[10px] font-semibold leading-tight ${isActive ? 'text-white' : 'text-zinc-400'}`}>
                {roleName(role, t)}
              </span>
              <span className={`text-[9px] ${isActive ? 'text-white/70' : 'text-zinc-500'}`}>
                {count}
              </span>
            </button>
          );
        })}
      </div>

      {roleCandidates.length === 0 ? (
        <p className="text-sm text-zinc-500 text-center py-6">{t.noCandidates}</p>
      ) : (
        <div className="space-y-2 max-h-[350px] overflow-y-auto pr-1">
          {roleCandidates.map(c => {
            const style = RARITY_STYLES[c.rarity];
            const Icon = RARITY_ICONS[c.rarity];
            const traitDef = c.trait ? TRAITS.find(trait => trait.id === c.trait) : null;
            const rarityLabelValue = t[RARITY_TRANSLATION_KEY[c.rarity] as keyof typeof t];
            const rarityLabel = typeof rarityLabelValue === 'string' ? rarityLabelValue : c.rarity;
            const offerSalary = offerByCandidate[c.id] ?? c.salaryIdeal ?? c.salary;
            const check = evaluateCandidateOffer(c.id, offerSalary);

            return (
              <div
                key={c.id}
                className={`rounded-lg border p-3 ${style.bg} ${style.border}`}
              >
                <div className="flex items-start justify-between gap-3">
                  <div className="flex-1 min-w-0">
                    <div className="flex items-center gap-2 mb-1">
                      <Icon className={`w-3.5 h-3.5 ${style.text}`} />
                      <span className="font-medium text-sm text-zinc-100 truncate">{c.name}</span>
                      <Badge className={`text-[10px] ${style.text} ${style.bg}`}>{rarityLabel}</Badge>
                    </div>
                    <div className="grid grid-cols-3 gap-x-3 gap-y-1 text-[11px]">
                      <div><span className="text-zinc-500">{t.experience}:</span> <span className="text-zinc-300">{c.experience}</span></div>
                      <div><span className="text-zinc-500">{t.talent}:</span> <span className="text-zinc-300">{Math.round(c.talent * 100)}%</span></div>
                      <div><span className="text-zinc-500">{t.resist}:</span> <span className="text-zinc-300">{Math.round(c.burnoutResistance * 100)}%</span></div>
                      <div><span className="text-zinc-500">{t.marketSalaryMinLabel}:</span> <span className="text-zinc-300">{formatMoney(c.salaryMin)}{t.perWeek}</span></div>
                      <div><span className="text-zinc-500">{t.marketSalaryIdealLabel}:</span> <span className="text-zinc-300">{formatMoney(c.salaryIdeal)}{t.perWeek}</span></div>
                      <div><span className="text-zinc-500">{t.marketWerLabel}:</span> <span className="text-zinc-300">{c.workplaceRequirement}/100</span></div>
                      <div className="col-span-3 text-zinc-400">
                        {traitDef ? <span className="text-amber-400" title={traitDef.description}>* {traitDef.name}</span> : null}
                      </div>
                    </div>
                  </div>
                  <div className="shrink-0 flex flex-col items-end gap-1.5">
                    <Badge variant={check.ok ? 'success' : 'warning'} className="text-[10px]">
                      {check.ok ? t.marketOfferAcceptChance(Math.round(check.chance * 100)) : offerReason(check.reason, t)}
                    </Badge>
                    <input
                      type="number"
                      min={Math.max(1, c.salaryMin)}
                      value={offerSalary}
                      onChange={(e) => {
                        const value = Math.max(1, Math.round(Number(e.target.value || 0)));
                        setOfferByCandidate(prev => ({ ...prev, [c.id]: value }));
                      }}
                      className="w-28 bg-zinc-900 border border-zinc-700 rounded px-2 py-1 text-xs text-zinc-200"
                    />
                    <Button
                      size="sm"
                      variant={check.ok ? 'primary' : 'secondary'}
                      disabled={!check.ok}
                      onClick={() => makeCandidateOffer(c.id, offerSalary)}
                      className="shrink-0 text-xs"
                      title={check.ok ? '' : offerReason(check.reason, t)}
                    >
                      {t.marketOfferAction(formatMoney(c.hireCost))}
                    </Button>
                  </div>
                </div>
              </div>
            );
          })}
        </div>
      )}
    </Card>
  );
}
