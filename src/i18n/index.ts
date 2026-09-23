import { getLocales } from 'expo-localization';

import { usePlayerStore } from '@/store/usePlayerStore';

import { en } from './en';
import { tr, type Strings } from './tr';

export type Language = 'tr' | 'en';
/** What the player picked in Settings; "system" follows the device. */
export type LanguageSetting = 'system' | Language;

const dictionaries: Record<Language, Strings> = { tr, en };

/** Turkish devices get Turkish; everyone else gets English. */
export function deviceLanguage(): Language {
  try {
    return getLocales()[0]?.languageCode === 'tr' ? 'tr' : 'en';
  } catch {
    return 'tr';
  }
}

export function resolveLanguage(setting: LanguageSetting): Language {
  return setting === 'system' ? deviceLanguage() : setting;
}

export function stringsFor(language: Language): Strings {
  return dictionaries[language];
}

/** The current dictionary; re-renders when the player changes language. */
export function useT(): Strings {
  const setting = usePlayerStore((s) => s.settings.language);
  return dictionaries[resolveLanguage(setting)];
}

export type { Strings };
