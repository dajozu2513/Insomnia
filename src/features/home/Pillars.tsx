import { FiligreeDivider } from '../motifs';
import { FADE_THRESHOLD, useInView } from '../../hooks/useInView';
import { useI18n } from '../../i18n';
import { LinkIcon, MoonIcon, QuoteIcon } from './PillarIcons';
import './Pillars.css';

const ICONS = [LinkIcon, QuoteIcon, MoonIcon] as const;

const SHAPES = 'circle, ellipse, line, path, polygon, polyline, rect';

/**
 * Prepares an icon to draw itself (legacy main.js): every shape with a stroke
 * gets `.draw` and its measured outline length as --len; solid shapes
 * (stroke="none") get `.fill` and fade in after the outlines.
 */
function prepareIcon(icon: HTMLElement | null): void {
  if (!icon) return;
  icon.querySelectorAll<SVGGeometryElement>(SHAPES).forEach((shape) => {
    if (shape.getAttribute('stroke') === 'none') {
      shape.classList.add('fill');
    } else {
      shape.style.setProperty('--len', String(Math.ceil(shape.getTotalLength()) + 1));
      shape.classList.add('draw');
    }
  });
}

/** Pillars (reality, bone): Steel, Words, Vigil. */
export function Pillars() {
  const { t } = useI18n();
  const [ref, visible] = useInView<HTMLDivElement>(FADE_THRESHOLD);

  return (
    <section className="pillars-section" aria-label={t.home.pillarsLabel}>
      <FiligreeDivider className="pillars-filigree" size={240} />
      <div ref={ref} className={visible ? 'pillars visible' : 'pillars'}>
        {t.home.pillars.map((pillar, i) => {
          const Icon = ICONS[i] ?? LinkIcon;
          return (
            <div key={i} className="pillar" style={{ '--p': i }}>
              <span ref={prepareIcon} className="pillar-icon-wrap">
                <Icon />
              </span>
              <h2 className="pillar-title">{pillar.title}</h2>
              <p className="pillar-text">{pillar.text}</p>
            </div>
          );
        })}
      </div>
    </section>
  );
}
