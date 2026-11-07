import { PocketWatch } from '../../features/clock/PocketWatch';
import { useI18n } from '../../i18n';

/** Sample times as night progress (6:00 PM = 0, 6:00 AM = 1); captions are in the dictionary. */
const SAMPLES = [0, 227 / 720, 0.5, 587 / 720, 1] as const;

/** Header size (as in ScrollClock) and the intro's largest size. */
const SIZES = [
  { px: 28, doubleRim: false },
  { px: 88, doubleRim: true },
] as const;

export function ClockSection() {
  const { t } = useI18n();
  const copy = t.lab.clock;

  return (
    <section className="lab-section" aria-labelledby="lab-clock">
      <h2 id="lab-clock" className="lab-heading">
        {copy.title}
      </h2>
      <p className="lab-text">{copy.text}</p>

      <div className="lab-watch-grid">
        {SIZES.map(({ px, doubleRim }) => (
          <div key={px} className="lab-watch-row">
            <p className="lab-specimen-meta">
              {px === 28 ? copy.headerSize : copy.introSize} ({px} px)
            </p>
            <ul className="lab-watches">
              {SAMPLES.map((progress, i) => (
                <li key={progress} className="lab-watch">
                  <PocketWatch size={px} progress={progress} doubleRim={doubleRim} />
                  <span className="lab-watch-caption">{copy.captions[i]}</span>
                </li>
              ))}
            </ul>
          </div>
        ))}
      </div>
    </section>
  );
}
