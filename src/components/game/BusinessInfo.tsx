'use client';

import { useGameStore } from '@/game/store';
import { useI18n } from '@/i18n';
import { nicheName, productName, monName, marketName, techName } from '@/i18n/game-text';
import { Card, CardTitle } from '@/components/ui/card';
import { Badge } from '@/components/ui/badge';
import { NICHES, PRODUCTS, MONETIZATIONS, TECHNOLOGIES, MARKETS } from '@/game/data';
import { Building2 } from 'lucide-react';

export function BusinessInfo() {
  const { business } = useGameStore();
  const { t } = useI18n();

  const niche = NICHES.find(n => n.id === business.nicheId);
  const product = PRODUCTS.find(p => p.id === business.productId);
  const monetization = MONETIZATIONS.find(m => m.id === business.monetizationId);
  const market = MARKETS.find(m => m.id === business.marketId);
  const techs = TECHNOLOGIES.filter(tc => business.technologies.includes(tc.id));

  return (
    <Card>
      <CardTitle className="flex items-center gap-2 mb-3">
        <Building2 className="w-5 h-5 text-emerald-400" />
        {t.yourBusiness}
      </CardTitle>

      <div className="space-y-2 text-sm">
        <div className="flex justify-between">
          <span className="text-zinc-400">{t.niche}</span>
          <Badge variant="info">{niche ? nicheName(niche.id, t, niche.name) : '—'}</Badge>
        </div>
        <div className="flex justify-between">
          <span className="text-zinc-400">{t.product}</span>
          <Badge variant="info">{product ? productName(product.id, t, product.name) : '—'}</Badge>
        </div>
        <div className="flex justify-between">
          <span className="text-zinc-400">{t.monetization}</span>
          <Badge variant="info">{monetization ? monName(monetization.id, t, monetization.name) : '—'}</Badge>
        </div>
        <div className="flex justify-between">
          <span className="text-zinc-400">{t.market}</span>
          <Badge variant="info">{market ? marketName(market.id, t, market.name) : '—'}</Badge>
        </div>
        <div className="flex justify-between items-start">
          <span className="text-zinc-400">{t.technologies}</span>
          <div className="flex flex-wrap gap-1 justify-end max-w-[60%]">
            {techs.length > 0 ? techs.map(tc => (
              <Badge key={tc.id} variant="success">{techName(tc.id, t, tc.name)}</Badge>
            )) : (
              <span className="text-zinc-500 text-xs">{t.none}</span>
            )}
          </div>
        </div>
      </div>
    </Card>
  );
}
