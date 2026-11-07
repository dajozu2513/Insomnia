import { useCallback, useEffect, useMemo, useState, type ReactNode } from 'react';

import { dictionaries } from './dictionaries';
import { LanguageContext, type LanguageContextValue } from './LanguageContext';
import { DEFAULT_LANG, LANG_STORAGE_KEY, isLang, type Lang } from './types';

// Storage can throw (private mode, blocked site data); the site must still work.
function readStoredLang(): Lang {
  try {
    const stored = window.localStorage.getItem(LANG_STORAGE_KEY);
    return isLang(stored) ? stored : DEFAULT_LANG;
  } catch {
    return DEFAULT_LANG;
  }
}

function storeLang(lang: Lang): void {
  try {
    window.localStorage.setItem(LANG_STORAGE_KEY, lang);
  } catch {
    // Not persisted; the choice still applies for this visit.
  }
}

interface LanguageProviderProps {
  children: ReactNode;
}

export function LanguageProvider({ children }: LanguageProviderProps) {
  const [lang, setLangState] = useState<Lang>(readStoredLang);

  useEffect(() => {
    document.documentElement.lang = lang;
    // index.html ships the Spanish description for crawlers; keep it in the visitor's language.
    document
      .querySelector('meta[name="description"]')
      ?.setAttribute('content', dictionaries[lang].meta.description);
  }, [lang]);

  const setLang = useCallback((next: Lang) => {
    setLangState(next);
    storeLang(next);
  }, []);

  const value = useMemo<LanguageContextValue>(
    () => ({ lang, setLang, t: dictionaries[lang] }),
    [lang, setLang],
  );

  return <LanguageContext value={value}>{children}</LanguageContext>;
}
