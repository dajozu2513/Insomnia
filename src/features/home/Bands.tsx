import { useI18n } from '../../i18n';
import { Band } from './Band';

/** Band 1, before the jewelry: the chain sags under the phrase. */
export function SteelBand() {
  const { t } = useI18n();
  return (
    <Band variant="phrase">
      <p className="separator-headline">
        <span className="reveal-wrap">
          <span className="reveal-line">{t.home.band1}</span>
        </span>
      </p>
    </Band>
  );
}

/** Band 2, before the T-shirts: "Sonder" and its meaning; the chain hangs above. */
export function SonderBand() {
  const { t } = useI18n();
  const { word, meaning } = t.home.band2;
  return (
    <Band variant="word">
      {/* The word is English in both languages */}
      <p className="band-word" lang="en">
        <span className="reveal-wrap">
          <span className="reveal-line">{word}</span>
        </span>
      </p>
      <p className="band-meaning">{meaning}</p>
    </Band>
  );
}
