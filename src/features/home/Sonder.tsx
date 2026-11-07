import { FADE_THRESHOLD, useInView } from '../../hooks/useInView';
import { useI18n } from '../../i18n';
import './Sonder.css';

/**
 * Opens the T-shirt section: "Sonder" in the display face and its meaning in
 * body text, on bone (reality). The word is English in both languages.
 */
export function Sonder() {
  const { t } = useI18n();
  const { word, meaning } = t.home.tshirts.sonder;
  const [ref, visible] = useInView<HTMLDivElement>(FADE_THRESHOLD);

  return (
    <div ref={ref} className={visible ? 'sonder visible' : 'sonder'}>
      <p className="sonder-word" lang="en">
        {word}
      </p>
      <p className="sonder-meaning">{meaning}</p>
    </div>
  );
}
