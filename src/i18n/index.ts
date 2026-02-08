import { create } from 'zustand';
import { en, TranslationKeys } from './en';
import { ru } from './ru';

export type Locale = 'en' | 'ru';

const translations: Record<Locale, TranslationKeys> = { en, ru };

interface I18nStore {
  locale: Locale;
  t: TranslationKeys;
  setLocale: (locale: Locale) => void;
}

export const useI18n = create<I18nStore>((set) => ({
  locale: 'en',
  t: en,
  setLocale: (locale: Locale) => set({ locale, t: translations[locale] }),
}));
