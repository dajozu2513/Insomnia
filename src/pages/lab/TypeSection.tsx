import { PocketWatch } from '../../features/clock/PocketWatch';
import { useI18n } from '../../i18n';

const GROUNDS = ['bone', 'ink'] as const;

export function TypeSection() {
  const { t } = useI18n();
  const copy = t.lab.type;

  return (
    <section className="lab-section" aria-labelledby="lab-type">
      <h2 id="lab-type" className="lab-heading">
        {copy.title}
      </h2>
      <p className="lab-text">{copy.text}</p>

      <div className="lab-type-grid">
        {GROUNDS.map((ground) => (
          <article key={ground} className={`lab-specimen lab-specimen--${ground}`}>
            <p className="lab-specimen-meta">
              {copy.faces}
              {' / '}
              {ground === 'bone' ? copy.onBone : copy.onInk}
            </p>
            <h3 className="lab-specimen-heading">{t.meta.description}</h3>
            <p className="lab-specimen-label">{t.header.tagline}</p>
            {t.home.pillars.map((pillar) => (
              <div key={pillar.title} className="lab-specimen-pillar">
                <h4 className="lab-specimen-title">{pillar.title}</h4>
                <p className="lab-specimen-body">{pillar.text}</p>
              </div>
            ))}
            <div className="lab-specimen-ui">
              <p className="lab-specimen-label lab-specimen-label--link">{copy.label}</p>
              <PocketWatch size={28} progress={227 / 720} />
            </div>
          </article>
        ))}
      </div>
    </section>
  );
}
