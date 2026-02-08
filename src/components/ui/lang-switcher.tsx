'use client';

import { useI18n, Locale } from '@/i18n';
import { Globe } from 'lucide-react';

export function LangSwitcher() {
  const { locale, setLocale } = useI18n();

  const toggle = () => {
    setLocale(locale === 'en' ? 'ru' : 'en');
  };

  return (
    <button
      onClick={toggle}
      className="flex items-center gap-1.5 px-2.5 py-1.5 rounded-lg bg-zinc-800 border border-zinc-700/50 text-xs font-medium text-zinc-300 hover:bg-zinc-700 hover:text-zinc-100 transition-all"
      title="Switch language"
    >
      <Globe className="w-3.5 h-3.5" />
      {locale === 'en' ? 'RU' : 'EN'}
    </button>
  );
}
