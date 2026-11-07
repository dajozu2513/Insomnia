import { LANGS, useI18n } from '../../i18n';

export function LanguageToggle() {
  const { lang, setLang, t } = useI18n();

  return (
    <div className="lang-toggle" role="group" aria-label={t.a11y.languageGroup}>
      {LANGS.map((option) => (
        <button
          key={option}
          type="button"
          lang={option}
          className={option === lang ? 'lang-opt active' : 'lang-opt'}
          aria-pressed={option === lang}
          aria-label={t.a11y.languageNames[option]}
          onClick={() => {
            if (option !== lang) setLang(option);
          }}
        >
          {option.toUpperCase()}
        </button>
      ))}
    </div>
  );
}
