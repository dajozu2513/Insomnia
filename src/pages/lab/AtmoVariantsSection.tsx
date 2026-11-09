import { LINKS } from '../../data/links';
import { ATMO_PALETTES, ATMO_VARIANTS } from '../../features/atmosphere/variants';
import { CardFront } from '../../features/deck/CardFaces';
import { useI18n } from '../../i18n';
import '../../features/deck/deck.css';
import '../../features/intro/IntroSplash.css';

/** Mote positions in the preview (percent of the panel), and each one's breathing delay. */
const MOTES = [
  [12, 22, 0],
  [28, 64, 1.8],
  [44, 18, 3.1],
  [61, 72, 0.9],
  [74, 34, 2.4],
  [88, 58, 4.2],
  [36, 42, 5.0],
  [80, 14, 1.2],
  [18, 80, 3.7],
  [54, 50, 2.0],
] as const;

/**
 * The atmosphere variants under review (step 10), side by side: each panel is
 * scoped with data-atmo, so its tokens (accent, glow, the light in the mist,
 * the motes) are the variant's own. The 3D scene is a still of the home page
 * hero at midnight (public/lab/), captured from the running site; the live
 * one opens with ?atmo=.
 */
export function AtmoVariantsSection() {
  const { t } = useI18n();
  const copy = t.lab.atmoVariants;
  const sample = LINKS[2];

  return (
    <section className="lab-section" aria-labelledby="lab-atmo-variants">
      <h2 id="lab-atmo-variants" className="lab-heading">
        {copy.title}
      </h2>
      <p className="lab-text">{copy.text}</p>

      <div className="lab-atmo-grid">
        {ATMO_VARIANTS.map((variant) => {
          const palette = ATMO_PALETTES[variant];
          const scene = palette.scene;
          const values: [string, string][] = [
            [copy.accent, palette.accent],
            [copy.glow, palette.accentGlow],
            [copy.mist, scene.mist.colour],
            [copy.light, scene.mist.light],
            [copy.motes, scene.motes.colour],
            ...(palette.gold ? ([[copy.gold, palette.gold]] as [string, string][]) : []),
          ];
          return (
            <article key={variant} className="lab-atmo" data-atmo={variant}>
              <h3 className="lab-atmo-name">
                {copy.names[variant]}
                {variant !== 'current' && <span className="lab-atmo-key"> ?atmo={variant}</span>}
              </h3>

              <div className="lab-atmo-intro atmo-grain" aria-hidden="true">
                <div className="intro-red-mist" />
                <div className="atmo-vignette" />
                <span className="lab-atmo-title">Insomnia</span>
                {MOTES.map(([x, y, delay], i) => (
                  <span
                    key={i}
                    className="lab-atmo-mote"
                    style={{
                      left: `${String(x)}%`,
                      top: `${String(y)}%`,
                      animationDelay: `${String(delay)}s`,
                    }}
                  />
                ))}
              </div>

              <figure className="lab-atmo-scene">
                <img
                  src={`/lab/atmo-${variant}.webp`}
                  alt=""
                  width={640}
                  height={400}
                  loading="lazy"
                  decoding="async"
                />
                <figcaption className="lab-specimen-meta">{copy.scene}</figcaption>
              </figure>

              <div className="lab-atmo-bottom">
                {sample && (
                  <div className="lab-atmo-card">
                    <CardFront link={sample} />
                  </div>
                )}
                <dl className="lab-atmo-values">
                  {values.map(([label, value]) => (
                    <div key={label} className="lab-atmo-value">
                      <dt>{label}</dt>
                      <dd>
                        <span className="lab-atmo-swatch" style={{ background: value }} />
                        <code>{value}</code>
                      </dd>
                    </div>
                  ))}
                </dl>
              </div>

              <a className="lab-atmo-open" href={`/?atmo=${variant}`}>
                {copy.open}
              </a>
            </article>
          );
        })}
      </div>
    </section>
  );
}
