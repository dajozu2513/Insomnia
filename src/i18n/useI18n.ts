import { useContext } from 'react';

import { LanguageContext, type LanguageContextValue } from './LanguageContext';

/** Current language, its dictionary (t) and a setter. Must be used inside LanguageProvider. */
export function useI18n(): LanguageContextValue {
  const value = useContext(LanguageContext);
  if (!value) {
    throw new Error('useI18n must be used inside <LanguageProvider>.');
  }
  return value;
}
