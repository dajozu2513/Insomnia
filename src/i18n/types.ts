import type { es } from './es';

export const LANGS = ['es', 'en'] as const;

export type Lang = (typeof LANGS)[number];

export const DEFAULT_LANG: Lang = 'es';

/** localStorage key that remembers the visitor's language. */
export const LANG_STORAGE_KEY = 'insomnia-lang';

/** Shape of every dictionary, taken from the Spanish one (the default). */
export type Dictionary = typeof es;

export function isLang(value: unknown): value is Lang {
  return typeof value === 'string' && (LANGS as readonly string[]).includes(value);
}
