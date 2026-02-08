'use client';

import { useState, useEffect, useRef } from 'react';
import { useGameStore } from '@/game/store';
import { useI18n } from '@/i18n';
import { eventTitle as getEventTitle, eventDesc as getEventDesc, roleName, isoName } from '@/i18n/game-text';
import { ToastContainer, pushToast } from '@/components/ui/toast';
import { GameLoop } from './GameLoop';
import { TimeControls } from './TimeControls';
import { TopBar } from './TopBar';
import { MetricsPanel } from './MetricsPanel';
import { TeamPanel } from './TeamPanel';
import { ISOPanel } from './ISOPanel';
import { TechPanel } from './TechPanel';
import { EventLog } from './EventLog';
import { BusinessInfo } from './BusinessInfo';
import { MarketPanel } from './MarketPanel';
import { TechTreePanel } from './TechTreePanel';
import { FurniturePanel } from './FurniturePanel';
import { OfficeScene } from '@/office/OfficeScene';
import { Card, CardTitle } from '@/components/ui/card';
import { Badge } from '@/components/ui/badge';
import {
  BarChart3, Users, ClipboardCheck, Cpu, ScrollText, Building2,
  ShoppingBag, FlaskConical, Armchair,
} from 'lucide-react';

type Tab = 'overview' | 'team' | 'market' | 'tech' | 'research' | 'iso' | 'office' | 'log';

export function GameDashboard() {
  const { player, activeEvents } = useGameStore();
  const { t } = useI18n();
  const [activeTab, setActiveTab] = useState<Tab>('overview');
  const prevEventsRef = useRef<string[]>([]);

  // Push toast notifications when new events appear
  useEffect(() => {
    const prevIds = prevEventsRef.current;
    const newEvents = activeEvents.filter(e => !prevIds.includes(e.id));
    for (const event of newEvents) {
      pushToast({
        type: event.type === 'crisis' ? 'danger' : event.type === 'positive' ? 'success' : event.type === 'iso' ? 'warning' : 'info',
        title: getEventTitle(event.id, t, event.title),
        description: getEventDesc(event.id, t, event.description),
      });
    }
    prevEventsRef.current = activeEvents.map(e => e.id);
  }, [activeEvents, t]);

  const TABS: { id: Tab; label: string; icon: React.ComponentType<{ className?: string }> }[] = [
    { id: 'overview', label: t.tabOverview, icon: BarChart3 },
    { id: 'team', label: t.tabTeam, icon: Users },
    { id: 'market', label: 'Market', icon: ShoppingBag },
    { id: 'tech', label: t.tabTech, icon: Cpu },
    { id: 'research', label: 'Research', icon: FlaskConical },
    { id: 'iso', label: t.tabISO, icon: ClipboardCheck },
    { id: 'office', label: 'Office', icon: Armchair },
    { id: 'log', label: t.tabLog, icon: ScrollText },
  ];

  return (
    <div className="min-h-screen bg-zinc-950 text-zinc-100 flex flex-col">
      {/* Real-time game loop */}
      <GameLoop />
      <ToastContainer />
      <TopBar />

      {/* Office view — always visible, Game Dev Tycoon style */}
      <div className="flex-shrink-0">
        <OfficeScene />
      </div>

      {/* Bottom bar: tabs + time controls */}
      <div className="flex-shrink-0 bg-zinc-900/95 border-t border-zinc-700/50 backdrop-blur-sm">
        <div className="max-w-[1600px] mx-auto px-4 py-2 flex items-center justify-between">
          {/* Tab buttons */}
          <div className="flex gap-0.5">
            {TABS.map(tab => {
              const Icon = tab.icon;
              return (
                <button
                  key={tab.id}
                  onClick={() => setActiveTab(tab.id)}
                  className={`flex flex-col items-center gap-0.5 px-3 py-1.5 rounded-lg text-[11px] font-medium transition-all min-w-[56px] ${
                    activeTab === tab.id
                      ? 'bg-emerald-500/15 text-emerald-400 border border-emerald-500/30'
                      : 'text-zinc-400 hover:text-zinc-200 hover:bg-zinc-800/60 border border-transparent'
                  }`}
                >
                  <Icon className="w-4 h-4" />
                  {tab.label}
                </button>
              );
            })}
          </div>

          {/* Time controls */}
          <TimeControls />
        </div>
      </div>

      {/* Scrollable panel content */}
      <div className="flex-1 overflow-y-auto">
        <div className="max-w-[1600px] mx-auto px-4 py-4">
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

            {activeTab === 'market' && (
              <>
                <div className="lg:col-span-2">
                  <MarketPanel />
                </div>
                <div className="space-y-4">
                  <BusinessInfo />
                  <MetricsPanel />
                </div>
              </>
            )}

            {activeTab === 'research' && (
              <>
                <div className="lg:col-span-2">
                  <TechTreePanel />
                </div>
                <div className="space-y-4">
                  <BusinessInfo />
                  <MetricsPanel />
                </div>
              </>
            )}

            {activeTab === 'office' && (
              <>
                <div className="lg:col-span-2 space-y-4">
                  <FurniturePanel />
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
