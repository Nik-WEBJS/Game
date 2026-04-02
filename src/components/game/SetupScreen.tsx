'use client';

import { useGameStore } from '@/game/store';
import { useI18n } from '@/i18n';
import { nicheName, nicheDesc, productName, productDesc, techName, techDesc, monName, monDesc } from '@/i18n/game-text';
import { Card, CardTitle, CardDescription } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Badge } from '@/components/ui/badge';
import { LangSwitcher } from '@/components/ui/lang-switcher';
import { formatMoney } from '@/lib/utils';
import {
  Building2, ShoppingBag, CreditCard, Cpu, Rocket, Pencil,
  Zap, Shield, Diamond, Flame, Globe, Star, Crown, Target, Hexagon, Atom, Leaf,
} from 'lucide-react';
import type { LogoId } from '@/game/types';

const LOGO_PRESETS: { id: LogoId; icon: React.ComponentType<{ className?: string; style?: React.CSSProperties }>; color: string }[] = [
  { id: 'rocket',  icon: Rocket,  color: '#f43f5e' },
  { id: 'zap',     icon: Zap,     color: '#eab308' },
  { id: 'shield',  icon: Shield,  color: '#3b82f6' },
  { id: 'diamond', icon: Diamond, color: '#8b5cf6' },
  { id: 'flame',   icon: Flame,   color: '#f97316' },
  { id: 'globe',   icon: Globe,   color: '#06b6d4' },
  { id: 'star',    icon: Star,    color: '#fbbf24' },
  { id: 'crown',   icon: Crown,   color: '#a855f7' },
  { id: 'target',  icon: Target,  color: '#ef4444' },
  { id: 'hexagon', icon: Hexagon, color: '#14b8a6' },
  { id: 'atom',    icon: Atom,    color: '#6366f1' },
  { id: 'leaf',    icon: Leaf,    color: '#22c55e' },
];

export function SetupScreen() {
  const {
    business, player, availableNiches, availableProducts, availableMonetizations,
    availableTechnologies, setNiche, setProduct, setMonetization, adoptTechnology,
    removeTechnology, startGame, setCompanyName, setCompanyLogo,
  } = useGameStore();
  const { t } = useI18n();

  const canStart = business.nicheId && business.productId && business.monetizationId;

  return (
    <div className="min-h-screen bg-zinc-950 text-zinc-100">
      <div className="max-w-6xl mx-auto px-4 py-8">
        {/* Header */}
        <div className="text-center mb-10 relative">
          <div className="absolute right-0 top-0">
            <LangSwitcher />
          </div>
          <h1 className="text-4xl font-bold bg-gradient-to-r from-emerald-400 to-cyan-400 bg-clip-text text-transparent">
            {t.businessTycoon}
          </h1>
          <p className="text-zinc-400 mt-2 text-lg">{t.setupSubtitle}</p>
          <div className="mt-4">
            <Badge variant="info">{t.startingCapital}: {formatMoney(player.money)}</Badge>
          </div>
        </div>

        {/* Step 0: Company Name & Logo */}
        <section className="mb-8">
          <div className="flex items-center gap-2 mb-4">
            <Pencil className="w-5 h-5 text-pink-400" />
            <h2 className="text-xl font-semibold">{t.companyName}</h2>
          </div>
          <div className="flex flex-col md:flex-column gap-4 items-start">
            <input
              type="text"
              maxLength={24}
              value={business.companyName}
              onChange={(e) => setCompanyName(e.target.value)}
              placeholder={t.companyNamePlaceholder}
              className="flex-1 bg-zinc-900 border border-zinc-700 rounded-lg px-4 py-3 text-lg text-zinc-100 placeholder-zinc-500 focus:outline-none focus:ring-2 focus:ring-emerald-500/50 focus:border-emerald-500 transition-colors"
            />
            <div className="flex flex-col gap-2">
              <span className="text-sm text-zinc-400">{t.chooseLogo}</span>
              <div className="flex flex-wrap gap-2">
                {LOGO_PRESETS.map((preset) => {
                  const Icon = preset.icon;
                  const selected = business.logoId === preset.id;
                  return (
                    <button
                      key={preset.id}
                      onClick={() => setCompanyLogo(preset.id)}
                      className={`w-10 h-10 rounded-lg flex items-center justify-center transition-all duration-150 border-2 ${
                        selected
                          ? 'border-white scale-110 shadow-lg'
                          : 'border-zinc-700 hover:border-zinc-500 hover:scale-105'
                      }`}
                      style={{ backgroundColor: selected ? preset.color + '30' : 'rgba(39,39,42,0.8)' }}
                    >
                      <Icon className="w-5 h-5" style={{ color: preset.color }} />
                    </button>
                  );
                })}
              </div>
            </div>
          </div>
        </section>

        {/* Step 1: Choose Niche */}
        <section className="mb-8">
          <div className="flex items-center gap-2 mb-4">
            <Building2 className="w-5 h-5 text-emerald-400" />
            <h2 className="text-xl font-semibold">{t.chooseNiche}</h2>
          </div>
          <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
            {availableNiches.filter(n => n.unlocked).map(niche => (
              <Card
                key={niche.id}
                selected={business.nicheId === niche.id}
                onClick={() => setNiche(niche.id)}
              >
                <CardTitle>{nicheName(niche.id, t, niche.name)}</CardTitle>
                <CardDescription>{nicheDesc(niche.id, t, niche.description)}</CardDescription>
                <div className="mt-3 flex gap-2">
                  <Badge variant="success">{t.demand}: {(niche.baseDemand * 100).toFixed(0)}%</Badge>
                  <Badge variant="warning">{t.complexity}: {(niche.baseComplexity * 100).toFixed(0)}%</Badge>
                </div>
              </Card>
            ))}
          </div>
        </section>

        {/* Step 2: Choose Product */}
        <section className="mb-8">
          <div className="flex items-center gap-2 mb-4">
            <ShoppingBag className="w-5 h-5 text-cyan-400" />
            <h2 className="text-xl font-semibold">{t.chooseProduct}</h2>
          </div>
          <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
            {availableProducts.map(product => (
              <Card
                key={product.id}
                selected={business.productId === product.id}
                onClick={() => setProduct(product.id)}
              >
                <CardTitle>{productName(product.id, t, product.name)}</CardTitle>
                <CardDescription>{productDesc(product.id, t, product.description)}</CardDescription>
                <div className="mt-3 flex gap-2 flex-wrap">
                  {business.nicheId && (
                    <Badge variant={
                      (product.nicheFit[business.nicheId] ?? 1) >= 1.3 ? 'success' :
                      (product.nicheFit[business.nicheId] ?? 1) >= 1.0 ? 'info' : 'warning'
                    }>
                      {t.fit}: {((product.nicheFit[business.nicheId] ?? 1) * 100).toFixed(0)}%
                    </Badge>
                  )}
                </div>
              </Card>
            ))}
          </div>
        </section>

        {/* Step 3: Monetization */}
        <section className="mb-8">
          <div className="flex items-center gap-2 mb-4">
            <CreditCard className="w-5 h-5 text-amber-400" />
            <h2 className="text-xl font-semibold">{t.chooseMonetization}</h2>
          </div>
          <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
            {availableMonetizations.map(mon => (
              <Card
                key={mon.id}
                selected={business.monetizationId === mon.id}
                onClick={() => setMonetization(mon.id)}
              >
                <CardTitle>{monName(mon.id, t, mon.name)}</CardTitle>
                <CardDescription>{monDesc(mon.id, t, mon.description)}</CardDescription>
                <div className="mt-3 flex gap-2">
                  <Badge variant="success">{t.efficiency}: {(mon.efficiency * 100).toFixed(0)}%</Badge>
                  <Badge variant={mon.riskModifier > 0 ? 'danger' : mon.riskModifier < 0 ? 'success' : 'info'}>
                    {t.risk}: {mon.riskModifier > 0 ? '+' : ''}{(mon.riskModifier * 100).toFixed(0)}%
                  </Badge>
                </div>
              </Card>
            ))}
          </div>
        </section>

        {/* Step 4: Technologies (optional) */}
        <section className="mb-10">
          <div className="flex items-center gap-2 mb-4">
            <Cpu className="w-5 h-5 text-purple-400" />
            <h2 className="text-xl font-semibold">{t.chooseTech} <span className="text-zinc-500 text-sm font-normal">({t.optional})</span></h2>
          </div>
          <div className="grid grid-cols-1 md:grid-cols-3 lg:grid-cols-5 gap-3">
            {availableTechnologies.map(tech => {
              const adopted = business.technologies.includes(tech.id);
              return (
                <Card
                  key={tech.id}
                  selected={adopted}
                  onClick={() => adopted ? removeTechnology(tech.id) : adoptTechnology(tech.id)}
                >
                  <CardTitle className="text-sm">{techName(tech.id, t, tech.name)}</CardTitle>
                  <CardDescription className="text-xs">{techDesc(tech.id, t, tech.description)}</CardDescription>
                  <div className="mt-2 flex flex-col gap-1">
                    <Badge variant="info">{formatMoney(tech.cost)}</Badge>
                    <Badge variant="success">+{(tech.qualityBonus * 100).toFixed(0)}% {t.qualityLabel}</Badge>
                    <Badge variant="warning">+{(tech.complexityAdd * 100).toFixed(0)}% {t.complexityLabel}</Badge>
                  </div>
                </Card>
              );
            })}
          </div>
        </section>

        {/* Launch Button */}
        <div className="text-center">
          <Button
            size="lg"
            disabled={!canStart}
            onClick={startGame}
            className="text-lg px-10 py-4"
          >
            <Rocket className="w-5 h-5" />
            {t.launchBusiness}
          </Button>
          {!canStart && (
            <p className="text-zinc-500 text-sm mt-2">{t.selectToBegin}</p>
          )}
        </div>
      </div>
    </div>
  );
}
