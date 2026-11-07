import { createContext } from 'react';

import type { Dictionary, Lang } from './types';

export interface LanguageContextValue {
  lang: Lang;
  setLang: (lang: Lang) => void;
  /** Dictionary for the current language, e.g. t.header.tagline */
  t: Dictionary;
}

export const LanguageContext = createContext<LanguageContextValue | null>(null);
