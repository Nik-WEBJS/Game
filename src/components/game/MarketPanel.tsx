'use client';

import { useState } from 'react';
import { useGameStore } from '@/game/store';
import { useI18n } from '@/i18n';
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

export function MarketPanel() {
  const { business, player, hireFromMarket } = useGameStore();
  const { t } = useI18n();
  const [activeRole, setActiveRole] = useState<TeamRole>('developer');
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

      {/* Role tabs */}
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

      {/* Candidates for selected role */}
      {roleCandidates.length === 0 ? (
        <p className="text-sm text-zinc-500 text-center py-6">{t.noCandidates}</p>
      ) : (
        <div className="space-y-2 max-h-[350px] overflow-y-auto pr-1">
          {roleCandidates.map(c => {
            const style = RARITY_STYLES[c.rarity];
            const Icon = RARITY_ICONS[c.rarity];
            const traitDef = c.trait ? TRAITS.find(t => t.id === c.trait) : null;
            const rarityLabelValue = t[RARITY_TRANSLATION_KEY[c.rarity] as keyof typeof t];
            const rarityLabel = typeof rarityLabelValue === 'string' ? rarityLabelValue : c.rarity;

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
                      <div><span className="text-zinc-500">{t.salary}:</span> <span className="text-zinc-300">{formatMoney(c.salary)}{t.perWeek}</span></div>
                      <div className="col-span-2">
                        {traitDef && (
                          <span className="text-amber-400" title={traitDef.description}>
                            ✦ {traitDef.name}
                          </span>
                        )}
                      </div>
                    </div>
                  </div>
                  <Button
                    size="sm"
                    variant="primary"
                    onClick={() => hireFromMarket(c.id)}
                    className="shrink-0 text-xs"
                  >
                    {t.hireFor} {formatMoney(c.hireCost)}
                  </Button>
                </div>
              </div>
            );
          })}
        </div>
      )}
    </Card>
  );
}
