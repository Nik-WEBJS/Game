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
  Building2, ShoppingBag, CreditCard, Cpu, Rocket,
} from 'lucide-react';

export function SetupScreen() {
  const {
    business, player, availableNiches, availableProducts, availableMonetizations,
    availableTechnologies, setNiche, setProduct, setMonetization, adoptTechnology,
    removeTechnology, startGame,
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
                  disabled={!adopted && player.money < tech.cost}
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
