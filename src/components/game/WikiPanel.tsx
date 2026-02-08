'use client';

import { useState } from 'react';
import { useI18n } from '@/i18n';
import { Card, CardTitle } from '@/components/ui/card';
import { Badge } from '@/components/ui/badge';
import { eventTitle as getEventTitle, eventDesc as getEventDesc } from '@/i18n/game-text';
import {
  BookOpen, Zap, Shield, AlertTriangle, TrendingUp, Lightbulb,
  ChevronDown, ChevronRight, Sparkles, Skull, Clock, ArrowRight,
} from 'lucide-react';

type WikiTab = 'events' | 'lifecycle' | 'tips';

interface WikiEvent {
  id: string;
  type: 'positive' | 'crisis' | 'market' | 'internal' | 'iso';
  triggerKey: string;
  buffsKey: string;
  debuffsKey: string;
  avoidKey: string;
}

const WIKI_EVENTS: WikiEvent[] = [
  { id: 'market_boom', type: 'positive', triggerKey: 'wikiMarketBoomTrigger', buffsKey: 'wikiMarketBoomBuffs', debuffsKey: 'wikiMarketBoomDebuffs', avoidKey: 'wikiMarketBoomAvoid' },
  { id: 'market_downturn', type: 'market', triggerKey: 'wikiMarketDownturnTrigger', buffsKey: 'wikiMarketDownturnBuffs', debuffsKey: 'wikiMarketDownturnDebuffs', avoidKey: 'wikiMarketDownturnAvoid' },
  { id: 'new_competitor', type: 'market', triggerKey: 'wikiNewCompetitorTrigger', buffsKey: 'wikiNewCompetitorBuffs', debuffsKey: 'wikiNewCompetitorDebuffs', avoidKey: 'wikiNewCompetitorAvoid' },
  { id: 'team_conflict', type: 'internal', triggerKey: 'wikiTeamConflictTrigger', buffsKey: 'wikiTeamConflictBuffs', debuffsKey: 'wikiTeamConflictDebuffs', avoidKey: 'wikiTeamConflictAvoid' },
  { id: 'innovation_spark', type: 'positive', triggerKey: 'wikiInnovationTrigger', buffsKey: 'wikiInnovationBuffs', debuffsKey: 'wikiInnovationDebuffs', avoidKey: 'wikiInnovationAvoid' },
  { id: 'data_breach', type: 'crisis', triggerKey: 'wikiDataBreachTrigger', buffsKey: 'wikiDataBreachBuffs', debuffsKey: 'wikiDataBreachDebuffs', avoidKey: 'wikiDataBreachAvoid' },
  { id: 'server_outage', type: 'crisis', triggerKey: 'wikiServerOutageTrigger', buffsKey: 'wikiServerOutageBuffs', debuffsKey: 'wikiServerOutageDebuffs', avoidKey: 'wikiServerOutageAvoid' },
  { id: 'regulatory_fine', type: 'crisis', triggerKey: 'wikiRegulatoryFineTrigger', buffsKey: 'wikiRegulatoryFineBuffs', debuffsKey: 'wikiRegulatoryFineDebuffs', avoidKey: 'wikiRegulatoryFineAvoid' },
  { id: 'viral_growth', type: 'positive', triggerKey: 'wikiViralGrowthTrigger', buffsKey: 'wikiViralGrowthBuffs', debuffsKey: 'wikiViralGrowthDebuffs', avoidKey: 'wikiViralGrowthAvoid' },
  { id: 'media_feature', type: 'positive', triggerKey: 'wikiMediaFeatureTrigger', buffsKey: 'wikiMediaFeatureBuffs', debuffsKey: 'wikiMediaFeatureDebuffs', avoidKey: 'wikiMediaFeatureAvoid' },
  { id: 'talent_arrives', type: 'positive', triggerKey: 'wikiTalentTrigger', buffsKey: 'wikiTalentBuffs', debuffsKey: 'wikiTalentDebuffs', avoidKey: 'wikiTalentAvoid' },
  { id: 'iso_audit_surprise', type: 'iso', triggerKey: 'wikiIsoAuditTrigger', buffsKey: 'wikiIsoAuditBuffs', debuffsKey: 'wikiIsoAuditDebuffs', avoidKey: 'wikiIsoAuditAvoid' },
  { id: 'iso_recognition', type: 'iso', triggerKey: 'wikiIsoRecognitionTrigger', buffsKey: 'wikiIsoRecognitionBuffs', debuffsKey: 'wikiIsoRecognitionDebuffs', avoidKey: 'wikiIsoRecognitionAvoid' },
];

const TYPE_COLORS: Record<string, string> = {
  positive: 'border-emerald-700/40 bg-emerald-900/10',
  crisis: 'border-red-700/40 bg-red-900/10',
  market: 'border-amber-700/40 bg-amber-900/10',
  internal: 'border-purple-700/40 bg-purple-900/10',
  iso: 'border-cyan-700/40 bg-cyan-900/10',
};

const TYPE_BADGE: Record<string, { color: 'success' | 'danger' | 'warning' | 'info'; label: string }> = {
  positive: { color: 'success', label: '✨' },
  crisis: { color: 'danger', label: '🚨' },
  market: { color: 'warning', label: '📊' },
  internal: { color: 'info', label: '🏢' },
  iso: { color: 'info', label: '📋' },
};

const LIFECYCLE_STAGES = [
  { key: 'prototype', mult: '×0', weeks: '4', color: 'text-zinc-400' },
  { key: 'beta', mult: '×0.15', weeks: '3', color: 'text-blue-400' },
  { key: 'releaseStage', mult: '×0.7', weeks: '8+', color: 'text-cyan-400' },
  { key: 'growthStage', mult: '×1.0', weeks: '16+', color: 'text-emerald-400' },
  { key: 'maturityStage', mult: '×0.85', weeks: '24+', color: 'text-amber-400' },
  { key: 'declineStage', mult: '×0.5', weeks: '∞', color: 'text-red-400' },
];

export function WikiPanel() {
  const { t } = useI18n();
  const [activeTab, setActiveTab] = useState<WikiTab>('events');
  const [expandedEvent, setExpandedEvent] = useState<string | null>(null);

  const tabs: { id: WikiTab; label: string; icon: typeof BookOpen }[] = [
    { id: 'events', label: t.wikiEventsSection, icon: Zap },
    { id: 'lifecycle', label: t.wikiLifecycleSection, icon: Clock },
    { id: 'tips', label: t.wikiTipsSection, icon: Lightbulb },
  ];

  return (
    <Card className="p-4">
      <CardTitle className="flex items-center gap-2 text-base mb-4">
        <BookOpen className="w-4 h-4 text-violet-400" />
        {t.wikiTitle}
      </CardTitle>

      {/* Tab bar */}
      <div className="flex gap-1 mb-4 bg-zinc-800/50 rounded-lg p-1">
        {tabs.map(tab => {
          const Icon = tab.icon;
          return (
            <button
              key={tab.id}
              onClick={() => setActiveTab(tab.id)}
              className={`flex-1 flex items-center justify-center gap-1.5 px-3 py-1.5 rounded-md text-xs font-medium transition-all ${
                activeTab === tab.id
                  ? 'bg-violet-600/30 text-violet-300 border border-violet-500/30'
                  : 'text-zinc-400 hover:text-zinc-200 hover:bg-zinc-700/30'
              }`}
            >
              <Icon className="w-3.5 h-3.5" />
              {tab.label}
            </button>
          );
        })}
      </div>

      {/* Events tab */}
      {activeTab === 'events' && (
        <div className="space-y-2">
          <p className="text-xs text-zinc-400 mb-3">{t.wikiEventsIntro}</p>
          {WIKI_EVENTS.map(evt => {
            const isExpanded = expandedEvent === evt.id;
            const badge = TYPE_BADGE[evt.type];
            return (
              <div
                key={evt.id}
                className={`rounded-lg border p-3 transition-all cursor-pointer ${TYPE_COLORS[evt.type]} ${
                  isExpanded ? 'ring-1 ring-white/10' : ''
                }`}
                onClick={() => setExpandedEvent(isExpanded ? null : evt.id)}
              >
                <div className="flex items-center justify-between">
                  <div className="flex items-center gap-2">
                    {isExpanded ? (
                      <ChevronDown className="w-3.5 h-3.5 text-zinc-400" />
                    ) : (
                      <ChevronRight className="w-3.5 h-3.5 text-zinc-500" />
                    )}
                    <span className="text-sm font-medium text-zinc-100">
                      {getEventTitle(evt.id, t, evt.id)}
                    </span>
                    <Badge variant={badge.color} className="text-[10px]">{badge.label}</Badge>
                  </div>
                </div>

                {isExpanded && (
                  <div className="mt-3 ml-5.5 space-y-2 text-xs">
                    <p className="text-zinc-300 italic">{getEventDesc(evt.id, t, evt.id)}</p>

                    <div className="grid grid-cols-1 sm:grid-cols-2 gap-2 mt-2">
                      {/* Trigger */}
                      <div className="rounded-md bg-zinc-800/40 p-2 border border-zinc-700/30">
                        <div className="flex items-center gap-1 text-zinc-400 mb-1">
                          <AlertTriangle className="w-3 h-3" />
                          <span className="font-semibold uppercase text-[10px]">{t.wikiTrigger}</span>
                        </div>
                        <p className="text-zinc-300">{(t as any)[evt.triggerKey]}</p>
                      </div>

                      {/* How to avoid */}
                      <div className="rounded-md bg-zinc-800/40 p-2 border border-zinc-700/30">
                        <div className="flex items-center gap-1 text-zinc-400 mb-1">
                          <Shield className="w-3 h-3" />
                          <span className="font-semibold uppercase text-[10px]">{t.wikiAvoid}</span>
                        </div>
                        <p className="text-zinc-300">{(t as any)[evt.avoidKey]}</p>
                      </div>

                      {/* Buffs */}
                      <div className="rounded-md bg-emerald-900/20 p-2 border border-emerald-700/20">
                        <div className="flex items-center gap-1 text-emerald-400 mb-1">
                          <Sparkles className="w-3 h-3" />
                          <span className="font-semibold uppercase text-[10px]">{t.wikiBuffs}</span>
                        </div>
                        <p className="text-emerald-300">{(t as any)[evt.buffsKey]}</p>
                      </div>

                      {/* Debuffs */}
                      <div className="rounded-md bg-red-900/20 p-2 border border-red-700/20">
                        <div className="flex items-center gap-1 text-red-400 mb-1">
                          <Skull className="w-3 h-3" />
                          <span className="font-semibold uppercase text-[10px]">{t.wikiDebuffs}</span>
                        </div>
                        <p className="text-red-300">{(t as any)[evt.debuffsKey]}</p>
                      </div>
                    </div>
                  </div>
                )}
              </div>
            );
          })}
        </div>
      )}

      {/* Lifecycle tab */}
      {activeTab === 'lifecycle' && (
        <div className="space-y-3">
          <p className="text-xs text-zinc-400 mb-3">{t.wikiLifecycleIntro}</p>
          <div className="space-y-1">
            {LIFECYCLE_STAGES.map((stage, i) => (
              <div key={stage.key} className="flex items-center gap-3">
                <div className="flex items-center gap-2 flex-1">
                  {i > 0 && <ArrowRight className="w-3 h-3 text-zinc-600 -ml-1 mr-1" />}
                  <span className={`text-sm font-medium ${stage.color}`}>
                    {(t as any)[stage.key]}
                  </span>
                </div>
                <div className="flex items-center gap-4 text-xs">
                  <span className="text-zinc-400 w-16 text-right">{stage.weeks} {t.weekShort}</span>
                  <span className={`font-mono font-semibold w-12 text-right ${
                    stage.mult === '×0' ? 'text-zinc-500' :
                    stage.mult === '×1.0' ? 'text-emerald-400' : 'text-zinc-300'
                  }`}>{stage.mult}</span>
                </div>
              </div>
            ))}
          </div>

          <div className="mt-4 rounded-lg bg-zinc-800/40 border border-zinc-700/30 p-3">
            <h4 className="text-xs font-semibold text-zinc-300 mb-2">{t.wikiRolesSection}</h4>
            <p className="text-[11px] text-zinc-400 mb-2">{t.wikiRolesIntro}</p>
            <div className="space-y-1.5 text-xs">
              <div className="flex items-center gap-2">
                <Badge variant="info" className="text-[10px] w-24 justify-center">{t.roleDeveloper}</Badge>
                <span className="text-zinc-300">+{t.qualityLabel}, +XP</span>
              </div>
              <div className="flex items-center gap-2">
                <Badge variant="info" className="text-[10px] w-24 justify-center">{t.roleManager}</Badge>
                <span className="text-zinc-300">+{t.efficiency}, +ISO</span>
              </div>
              <div className="flex items-center gap-2">
                <Badge variant="info" className="text-[10px] w-24 justify-center">{t.roleQA}</Badge>
                <span className="text-zinc-300">+{t.qualityLabel}, +ISO, -{t.risk}</span>
              </div>
              <div className="flex items-center gap-2">
                <Badge variant="info" className="text-[10px] w-24 justify-center">{t.roleSecurity}</Badge>
                <span className="text-zinc-300">-{t.risk}</span>
              </div>
              <div className="flex items-center gap-2">
                <Badge variant="info" className="text-[10px] w-24 justify-center">{t.roleMarketing}</Badge>
                <span className="text-zinc-300">+{t.growth}, +{t.demand}</span>
              </div>
            </div>
          </div>
        </div>
      )}

      {/* Tips tab */}
      {activeTab === 'tips' && (
        <div className="space-y-2">
          {[1, 2, 3, 4, 5, 6, 7, 8].map(i => (
            <div
              key={i}
              className="flex items-start gap-3 rounded-lg bg-zinc-800/30 border border-zinc-700/30 p-3"
            >
              <div className="w-6 h-6 rounded-full bg-violet-600/20 border border-violet-500/30 flex items-center justify-center shrink-0 mt-0.5">
                <span className="text-[10px] font-bold text-violet-400">{i}</span>
              </div>
              <p className="text-xs text-zinc-300 leading-relaxed">
                {(t as any)[`wikiTip${i}`]}
              </p>
            </div>
          ))}
        </div>
      )}
    </Card>
  );
}
