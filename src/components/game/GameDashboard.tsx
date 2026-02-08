'use client';

import { useState } from 'react';
import { useGameStore } from '@/game/store';
import { useI18n } from '@/i18n';
import { eventTitle as getEventTitle, eventDesc as getEventDesc, roleName, isoName } from '@/i18n/game-text';
import { TopBar } from './TopBar';
import { MetricsPanel } from './MetricsPanel';
import { TeamPanel } from './TeamPanel';
import { ISOPanel } from './ISOPanel';
import { TechPanel } from './TechPanel';
import { EventLog } from './EventLog';
import { BusinessInfo } from './BusinessInfo';
import { Button } from '@/components/ui/button';
import { Card, CardTitle } from '@/components/ui/card';
import { Badge } from '@/components/ui/badge';
import {
  Play, BarChart3, Users, ClipboardCheck, Cpu, ScrollText, Building2, ChevronRight,
} from 'lucide-react';

type Tab = 'overview' | 'team' | 'tech' | 'iso' | 'log';

export function GameDashboard() {
  const { nextTurn, player, activeEvents } = useGameStore();
  const { t } = useI18n();
  const [activeTab, setActiveTab] = useState<Tab>('overview');

  const TABS: { id: Tab; label: string; icon: React.ElementType }[] = [
    { id: 'overview', label: t.tabOverview, icon: BarChart3 },
    { id: 'team', label: t.tabTeam, icon: Users },
    { id: 'tech', label: t.tabTech, icon: Cpu },
    { id: 'iso', label: t.tabISO, icon: ClipboardCheck },
    { id: 'log', label: t.tabLog, icon: ScrollText },
  ];

  return (
    <div className="min-h-screen bg-zinc-950 text-zinc-100">
      <TopBar />

      <div className="max-w-[1600px] mx-auto px-4 py-4">
        {/* Active Events Banner */}
        {activeEvents.length > 0 && (
          <div className="mb-4 space-y-2">
            {activeEvents.map(event => {
              const colors: Record<string, string> = {
                market: 'border-blue-500/50 bg-blue-950/30',
                internal: 'border-zinc-500/50 bg-zinc-800/30',
                crisis: 'border-red-500/50 bg-red-950/30',
                positive: 'border-emerald-500/50 bg-emerald-950/30',
                iso: 'border-amber-500/50 bg-amber-950/30',
              };
              return (
                <div
                  key={event.id}
                  className={`rounded-lg border p-3 flex items-center gap-3 ${colors[event.type] || ''}`}
                >
                  <Badge variant={
                    event.type === 'crisis' ? 'danger' :
                    event.type === 'positive' ? 'success' :
                    event.type === 'iso' ? 'warning' : 'info'
                  }>
                    {event.type.toUpperCase()}
                  </Badge>
                  <div>
                    <span className="text-sm font-medium text-zinc-200">{getEventTitle(event.id, t, event.title)}</span>
                    <span className="text-xs text-zinc-400 ml-2">{getEventDesc(event.id, t, event.description)}</span>
                  </div>
                </div>
              );
            })}
          </div>
        )}

        {/* Tab Navigation + Next Turn */}
        <div className="flex items-center justify-between mb-4">
          <div className="flex gap-1 bg-zinc-900/80 rounded-lg p-1 border border-zinc-700/50">
            {TABS.map(tab => {
              const Icon = tab.icon;
              return (
                <button
                  key={tab.id}
                  onClick={() => setActiveTab(tab.id)}
                  className={`flex items-center gap-1.5 px-3 py-2 rounded-md text-sm font-medium transition-all ${
                    activeTab === tab.id
                      ? 'bg-zinc-700 text-zinc-100'
                      : 'text-zinc-400 hover:text-zinc-200 hover:bg-zinc-800'
                  }`}
                >
                  <Icon className="w-4 h-4" />
                  {tab.label}
                </button>
              );
            })}
          </div>

          <Button size="lg" onClick={nextTurn} className="gap-2">
            <Play className="w-4 h-4" />
            {t.nextWeek}
            <ChevronRight className="w-4 h-4" />
          </Button>
        </div>

        {/* Content */}
        <div className="grid grid-cols-1 lg:grid-cols-3 gap-4">
          {activeTab === 'overview' && (
            <>
              <div className="lg:col-span-2 space-y-4">
                <MetricsPanel />
                <EventLog />
              </div>
              <div className="space-y-4">
                <BusinessInfo />
                <QuickStats />
              </div>
            </>
          )}

          {activeTab === 'team' && (
            <>
              <div className="lg:col-span-2">
                <TeamPanel />
              </div>
              <div className="space-y-4">
                <BusinessInfo />
                <MetricsPanel />
              </div>
            </>
          )}

          {activeTab === 'tech' && (
            <>
              <div className="lg:col-span-2">
                <TechPanel />
              </div>
              <div className="space-y-4">
                <BusinessInfo />
                <MetricsPanel />
              </div>
            </>
          )}

          {activeTab === 'iso' && (
            <>
              <div className="lg:col-span-2">
                <ISOPanel />
              </div>
              <div className="space-y-4">
                <BusinessInfo />
                <MetricsPanel />
              </div>
            </>
          )}

          {activeTab === 'log' && (
            <>
              <div className="lg:col-span-2">
                <EventLog />
              </div>
              <div className="space-y-4">
                <BusinessInfo />
                <MetricsPanel />
              </div>
            </>
          )}
        </div>
      </div>
    </div>
  );
}

function QuickStats() {
  const { business, player } = useGameStore();
  const { t } = useI18n();

  const teamByRole: Record<string, number> = {};
  for (const m of business.team) {
    teamByRole[m.role] = (teamByRole[m.role] || 0) + 1;
  }

  const isoStatus = business.isoStandards.map(iso => ({
    id: iso.id,
    name: iso.name,
    certified: iso.certified,
    stage: iso.currentStage,
  }));

  return (
    <Card>
      <CardTitle className="flex items-center gap-2 mb-3">
        <Building2 className="w-5 h-5 text-zinc-400" />
        {t.quickStats}
      </CardTitle>

      <div className="space-y-3 text-sm">
        <div>
          <span className="text-zinc-400 text-xs uppercase tracking-wider">{t.teamComposition}</span>
          <div className="flex flex-wrap gap-1 mt-1">
            {Object.entries(teamByRole).map(([role, count]) => (
              <Badge key={role} variant="info">{roleName(role, t)}: {count}</Badge>
            ))}
            {business.team.length === 0 && <span className="text-zinc-500 text-xs">{t.noTeam}</span>}
          </div>
        </div>

        <div>
          <span className="text-zinc-400 text-xs uppercase tracking-wider">{t.isoStatus}</span>
          <div className="flex flex-wrap gap-1 mt-1">
            {isoStatus.map(iso => (
              <Badge
                key={iso.name}
                variant={iso.certified ? 'success' : iso.stage !== 'none' ? 'warning' : 'default'}
              >
                {isoName(iso.id, t, iso.name)}: {iso.certified ? t.certified : iso.stage !== 'none' ? t.isoInProgress : t.notStarted}
              </Badge>
            ))}
          </div>
        </div>

        <div>
          <span className="text-zinc-400 text-xs uppercase tracking-wider">{t.winConditions}</span>
          <div className="space-y-1 mt-1">
            <div className="flex justify-between text-xs">
              <span className="text-zinc-400">{t.ipoCondition}</span>
              <span className={player.money >= 500000 && player.reputation >= 80 ? 'text-emerald-400' : 'text-zinc-500'}>
                {player.money >= 500000 ? '✓' : '✗'} {t.money} | {player.reputation >= 80 ? '✓' : '✗'} {t.rep}
              </span>
            </div>
            <div className="flex justify-between text-xs">
              <span className="text-zinc-400">{t.dominanceCondition}</span>
              <span className={player.reputation >= 95 && business.metrics.quality >= 0.9 ? 'text-emerald-400' : 'text-zinc-500'}>
                {player.reputation >= 95 ? '✓' : '✗'} {t.rep} | {business.metrics.quality >= 0.9 ? '✓' : '✗'} {t.quality}
              </span>
            </div>
          </div>
        </div>
      </div>
    </Card>
  );
}
