'use client';

import { useState, useEffect, useRef, useCallback } from 'react';
import { useGameStore } from '@/game/store';
import { useI18n } from '@/i18n';
import { TranslationKeys } from '@/i18n/en';
import { eventTitle as getEventTitle, eventDesc as getEventDesc, roleName, isoName } from '@/i18n/game-text';
import { ToastContainer, pushToast } from '@/components/ui/toast';
import { GameLoop } from './GameLoop';
import { TimeControls } from './TimeControls';
import { MetricsPanel } from './MetricsPanel';
import { TeamPanel } from './TeamPanel';
import { ISOPanel } from './ISOPanel';
import { TechPanel } from './TechPanel';
import { EventLog } from './EventLog';
import { BusinessInfo } from './BusinessInfo';
import { ProductPanel } from './ProductPanel';
import { ProductionPanel } from './ProductionPanel';
import { InfrastructurePanel } from './InfrastructurePanel';
import { CompetitionPanel } from './CompetitionPanel';
import { MarketPanel } from './MarketPanel';
import { TechTreePanel } from './TechTreePanel';
import { FurniturePanel } from './FurniturePanel';
import { WikiPanel } from './WikiPanel';
import { MiniMetrics } from './MiniMetrics';
import { OfficeScene } from '@/office/OfficeScene';
import { DebugSandbox } from './DebugSandbox';
import { subscribePlacement, furniturePlacement } from '@/office/furnitureState';
import { Card, CardTitle } from '@/components/ui/card';
import { Badge } from '@/components/ui/badge';
import { formatMoney } from '@/lib/utils';
import {
  BarChart3, Users, ClipboardCheck, Cpu, ScrollText,
  ShoppingBag, FlaskConical, Armchair, X, DollarSign, Star, Globe, BookOpen, TrendingUp, Factory, Server, Trophy,
} from 'lucide-react';

type MenuId = 'overview' | 'product' | 'production' | 'infra' | 'competition' | 'team' | 'market' | 'tech' | 'research' | 'iso' | 'office' | 'log' | 'wiki' | null;

type MenuItem = { id: Exclude<MenuId, null>; icon: typeof BarChart3; color: string; labelKey: keyof TranslationKeys };

function menuLabel(t: TranslationKeys, key: keyof TranslationKeys): string {
  const value = t[key];
  if (typeof value === 'function') return String(key);
  return value;
}

const MENU_ITEMS: MenuItem[] = [
  { id: 'overview', icon: BarChart3, color: 'from-emerald-500 to-emerald-700', labelKey: 'tabOverview' },
  { id: 'product', icon: TrendingUp, color: 'from-indigo-500 to-indigo-700', labelKey: 'tabProduct' },
  { id: 'production', icon: Factory, color: 'from-cyan-500 to-cyan-700', labelKey: 'tabProduction' },
  { id: 'infra', icon: Server, color: 'from-sky-500 to-sky-700', labelKey: 'tabInfra' },
  { id: 'competition', icon: Trophy, color: 'from-amber-500 to-amber-700', labelKey: 'tabCompetition' },
  { id: 'team', icon: Users, color: 'from-cyan-500 to-cyan-700', labelKey: 'tabTeam' },
  { id: 'market', icon: ShoppingBag, color: 'from-purple-500 to-purple-700', labelKey: 'tabMarket' },
  { id: 'tech', icon: Cpu, color: 'from-blue-500 to-blue-700', labelKey: 'tabTech' },
  { id: 'research', icon: FlaskConical, color: 'from-indigo-500 to-indigo-700', labelKey: 'tabResearch' },
  { id: 'iso', icon: ClipboardCheck, color: 'from-amber-500 to-amber-700', labelKey: 'tabISO' },
  { id: 'office', icon: Armchair, color: 'from-orange-500 to-orange-700', labelKey: 'tabOffice' },
  { id: 'log', icon: ScrollText, color: 'from-zinc-400 to-zinc-600', labelKey: 'tabLog' },
  { id: 'wiki', icon: BookOpen, color: 'from-violet-500 to-violet-700', labelKey: 'tabWiki' },
];

export function GameDashboard() {
  const { player, activeEvents } = useGameStore();
  const { t, locale, setLocale } = useI18n();
  const [openMenu, setOpenMenu] = useState<MenuId>('product');
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

  // ESC to close modal
  useEffect(() => {
    if (!openMenu) return;
    const onKey = (e: KeyboardEvent) => {
      if (e.key === 'Escape') setOpenMenu(null);
    };
    window.addEventListener('keydown', onKey);
    return () => window.removeEventListener('keydown', onKey);
  }, [openMenu]);

  // Close modal when furniture placement starts
  useEffect(() => {
    return subscribePlacement(() => {
      if (furniturePlacement.active) setOpenMenu(null);
    });
  }, []);

  const toggleMenu = useCallback((id: Exclude<MenuId, null>) => {
    setOpenMenu(prev => prev === id ? null : id);
  }, []);

  return (
    <div className="h-screen w-screen bg-zinc-950 text-zinc-100 overflow-hidden relative">
      {/* Real-time game loop */}
      <GameLoop />
      <ToastContainer />
      <DebugSandbox />

      {/* Full-screen office view */}
      <div className="absolute inset-0">
        <OfficeScene />
      </div>

      {/* Top HUD — money, reputation, round menu buttons */}
      <div className="absolute top-0 left-0 right-0 z-20 pointer-events-none">
        <div className="flex items-start justify-between px-4 pt-3">
          {/* Left: stats */}
          <div className="pointer-events-auto flex items-center gap-3">
            <div className="flex items-center gap-1.5 bg-zinc-900/70 backdrop-blur-md rounded-full px-3 py-1.5 border border-zinc-700/40">
              <DollarSign className="w-3.5 h-3.5 text-emerald-400" />
              <span className="text-sm font-semibold text-emerald-400">{formatMoney(player.money)}</span>
            </div>
            <div className="flex items-center gap-1.5 bg-zinc-900/70 backdrop-blur-md rounded-full px-3 py-1.5 border border-zinc-700/40">
              <Star className="w-3.5 h-3.5 text-amber-400" />
              <span className="text-sm font-semibold text-amber-400">{player.reputation}</span>
            </div>
          </div>

          {/* Center: round menu buttons */}
          <div className="pointer-events-auto flex items-center gap-2">
            {MENU_ITEMS.map(item => {
              const Icon = item.icon;
              const isActive = openMenu === item.id;
              return (
                <button
                  key={item.id}
                  onClick={() => toggleMenu(item.id)}
                  className={`group relative w-11 h-11 rounded-full flex items-center justify-center transition-all duration-200 border-2 shadow-lg ${
                    isActive
                      ? `bg-gradient-to-br ${item.color} border-white/30 scale-110 shadow-xl`
                      : 'bg-zinc-900/70 backdrop-blur-md border-zinc-600/40 hover:border-zinc-400/60 hover:scale-105'
                  }`}
                  title={menuLabel(t, item.labelKey)}
                >
                  <Icon className={`w-5 h-5 ${isActive ? 'text-white' : 'text-zinc-300 group-hover:text-white'}`} />
                  {/* Label tooltip on hover */}
                  <span className="absolute -bottom-6 left-1/2 -translate-x-1/2 text-[10px] font-medium text-zinc-300 opacity-0 group-hover:opacity-100 transition-opacity whitespace-nowrap pointer-events-none">
                    {menuLabel(t, item.labelKey)}
                  </span>
                </button>
              );
            })}
          </div>

          {/* Right: time controls + language + mini metrics */}
          <div className="pointer-events-auto flex flex-col items-end gap-2">
            <div className="flex items-center gap-2">
              <TimeControls />
              <button
                onClick={() => setLocale(locale === 'en' ? 'ru' : 'en')}
                className="flex items-center gap-1.5 bg-zinc-900/70 backdrop-blur-md rounded-full px-2.5 py-1.5 border border-zinc-700/40 hover:border-zinc-500/60 transition-all"
                title={t.language}
              >
                <Globe className="w-3.5 h-3.5 text-zinc-400" />
                <span className="text-xs font-semibold text-zinc-300">{t.lang}</span>
              </button>
            </div>
            <MiniMetrics />
          </div>
        </div>
      </div>

      {/* Glassmorphism modal overlay */}
      {openMenu && (
        <div
          className="absolute inset-0 z-30 flex items-center justify-center"
          onClick={(e) => { if (e.target === e.currentTarget) setOpenMenu(null); }}
        >
          {/* Backdrop */}
          <div className="absolute inset-0 bg-black/40 backdrop-blur-sm" />

          {/* Modal panel */}
          <div className="relative w-[90%] max-w-[1100px] max-h-[80vh] rounded-2xl overflow-hidden border border-white/10 shadow-2xl animate-in fade-in zoom-in-95 duration-200">
            {/* Glassmorphism background */}
            <div className="absolute inset-0 bg-zinc-900/60 backdrop-blur-xl" />

            {/* Header */}
            <div className="relative flex items-center justify-between px-6 py-4 border-b border-white/10">
              <div className="flex items-center gap-3">
                {(() => {
                  const item = MENU_ITEMS.find(m => m.id === openMenu);
                  if (!item) return null;
                  const Icon = item.icon;
                  return (
                    <>
                      <div className={`w-9 h-9 rounded-full bg-gradient-to-br ${item.color} flex items-center justify-center`}>
                        <Icon className="w-5 h-5 text-white" />
                      </div>
                      <h2 className="text-lg font-semibold text-zinc-100">{menuLabel(t, item.labelKey)}</h2>
                    </>
                  );
                })()}
              </div>
              <button
                onClick={() => setOpenMenu(null)}
                className="w-8 h-8 rounded-full bg-zinc-800/60 hover:bg-zinc-700/80 flex items-center justify-center transition-colors border border-zinc-600/30"
              >
                <X className="w-4 h-4 text-zinc-400" />
              </button>
            </div>

            {/* Content */}
            <div className="relative overflow-y-auto max-h-[calc(80vh-64px)] p-6">
              <div className="grid grid-cols-1 lg:grid-cols-3 gap-4">
                {openMenu === 'overview' && (
                  <>
                    <div className="lg:col-span-2 space-y-4">
                      <MetricsPanel />
                      <BusinessInfo />
                    </div>
                    <div className="space-y-4">
                      <QuickStats />
                      <EventLog />
                    </div>
                  </>
                )}
                {openMenu === 'product' && (
                  <>
                    <div className="lg:col-span-2"><ProductPanel /></div>
                    <div className="space-y-4"><MetricsPanel /></div>
                  </>
                )}
                {openMenu === 'production' && (
                  <>
                    <div className="lg:col-span-2"><ProductionPanel /></div>
                    <div className="space-y-4"><MetricsPanel /></div>
                  </>
                )}
                {openMenu === 'infra' && (
                  <>
                    <div className="lg:col-span-2"><InfrastructurePanel /></div>
                    <div className="space-y-4"><MetricsPanel /></div>
                  </>
                )}
                {openMenu === 'competition' && (
                  <>
                    <div className="lg:col-span-2"><CompetitionPanel /></div>
                    <div className="space-y-4"><MetricsPanel /></div>
                  </>
                )}
                {openMenu === 'team' && (
                  <>
                    <div className="lg:col-span-2"><TeamPanel /></div>
                    <div className="space-y-4"><MetricsPanel /></div>
                  </>
                )}
                {openMenu === 'market' && (
                  <>
                    <div className="lg:col-span-2"><MarketPanel /></div>
                    <div className="space-y-4"><MetricsPanel /></div>
                  </>
                )}
                {openMenu === 'tech' && (
                  <>
                    <div className="lg:col-span-2"><TechPanel /></div>
                    <div className="space-y-4"><MetricsPanel /></div>
                  </>
                )}
                {openMenu === 'research' && (
                  <>
                    <div className="lg:col-span-2"><TechTreePanel /></div>
                    <div className="space-y-4"><MetricsPanel /></div>
                  </>
                )}
                {openMenu === 'iso' && (
                  <>
                    <div className="lg:col-span-2"><ISOPanel /></div>
                    <div className="space-y-4"><MetricsPanel /></div>
                  </>
                )}
                {openMenu === 'office' && (
                  <>
                    <div className="lg:col-span-2"><FurniturePanel /></div>
                    <div className="space-y-4"><MetricsPanel /></div>
                  </>
                )}
                {openMenu === 'log' && (
                  <div className="lg:col-span-3"><EventLog /></div>
                )}
                {openMenu === 'wiki' && (
                  <div className="lg:col-span-3"><WikiPanel /></div>
                )}
              </div>
            </div>
          </div>
        </div>
      )}
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
