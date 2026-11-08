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
          onClick={() => {
            if (option !== lang) setLang(option);
          }}
        >
          {/* Spoken as "ES, Español": the visible code first, then the language */}
          {option.toUpperCase()}
          <span className="visually-hidden">, {t.a11y.languageNames[option]}</span>
        </button>
      ))}
    </div>
  );
}
