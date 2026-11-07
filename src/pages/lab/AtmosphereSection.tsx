import { useI18n } from '../../i18n';

export function AtmosphereSection() {
  const { t } = useI18n();
  const copy = t.lab.atmosphere;

  return (
    <section className="lab-section" aria-labelledby="lab-atmosphere">
      <h2 id="lab-atmosphere" className="lab-heading">
        {copy.title}
      </h2>
      <p className="lab-text">{copy.text}</p>

      <div className="lab-atmosphere atmo-grain">
        <div className="atmo-mist" aria-hidden="true" />
        <div className="atmo-vignette" aria-hidden="true" />
        <p className="lab-atmosphere-phrase">{t.brand.heroTagline}</p>
      </div>
    </section>
  );
}
