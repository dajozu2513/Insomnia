import { TEES, type PrintLanguage, type TeeColour, type TeeSide } from '../../data/tees';
import { COMPOSITIONS } from '../../features/tees/print/compositionMap';
import { useI18n } from '../../i18n';
import '../../features/tees/tees.css';

interface Variant {
  side: TeeSide;
  colour: TeeColour;
  lang: PrintLanguage;
}

/**
 * Front (the word alone, from a front-and-back print) is the same in both
 * languages; the back (word and meaning) is shown in Spanish and English.
 */
const VARIANTS: readonly Variant[] = [
  { side: 'front', colour: 'black', lang: 'es' },
  { side: 'front', colour: 'white', lang: 'es' },
  { side: 'back', colour: 'black', lang: 'es' },
  { side: 'back', colour: 'black', lang: 'en' },
  { side: 'back', colour: 'white', lang: 'es' },
  { side: 'back', colour: 'white', lang: 'en' },
];

/** The ten prints on their own, large, on swatches of the tee colours. */
export function PrintsSection() {
  const { t } = useI18n();
  const copy = t.lab.prints;

  return (
    <section className="lab-section" aria-labelledby="lab-prints">
      <h2 id="lab-prints" className="lab-heading">
        {copy.title}
      </h2>
      <p className="lab-text">{copy.text}</p>

      {TEES.map((tee) => {
        const Composition = COMPOSITIONS[tee.composition];
        return (
          <div key={tee.id} className="lab-prints-row">
            <p className="lab-specimen-meta">{tee.word}</p>
            <ul className="lab-prints">
              {VARIANTS.map((v) => (
                <li key={`${v.side}-${v.colour}-${v.lang}`} className="lab-print">
                  <span className={`lab-print-swatch lab-print-swatch--${v.colour}`}>
                    <Composition
                      tee={tee}
                      colour={v.colour}
                      lang={v.lang}
                      side={v.side}
                      placement="both"
                    />
                  </span>
                  <span className="lab-print-caption">
                    {v.side === 'front' ? copy.front : `${copy.back} ${v.lang.toUpperCase()}`},{' '}
                    {copy[v.colour].toLowerCase()}
                  </span>
                </li>
              ))}
            </ul>
          </div>
        );
      })}
    </section>
  );
}
