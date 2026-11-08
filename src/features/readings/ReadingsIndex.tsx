import { Link, useViewTransitionState } from 'react-router-dom';

import { ARTICLES, articlePath, type Article } from '../../data/articles';
import { FADE_THRESHOLD, useInView } from '../../hooks/useInView';
import { usePrefersReducedMotion } from '../../hooks/usePrefersReducedMotion';
import { useI18n } from '../../i18n';
import { PILLAR_ICONS, titleTransitionName } from './pillarIcon';
import './readings.css';

/**
 * The Readings index, ported from the legacy editorial index: one row per
 * article between 1px rules (number, pillar icon and category; title and
 * excerpt; "Read"), rising in one after another as they come into view.
 */
export function ReadingsIndex() {
  const { t } = useI18n();
  return (
    <ol className="readings" aria-label={t.home.articles.listLabel}>
      {ARTICLES.map((article, i) => (
        <ReadingRow key={article.slug} article={article} index={i} />
      ))}
    </ol>
  );
}

function ReadingRow({ article, index }: { article: Article; index: number }) {
  const { t, lang } = useI18n();
  const reducedMotion = usePrefersReducedMotion();
  const [rowRef, visible] = useInView<HTMLLIElement>(FADE_THRESHOLD);
  const path = articlePath(article.slug);
  // The title carries the shared name only while a transition to or from its
  // article runs, so the other two titles never take part in the morph.
  const morphing = useViewTransitionState(path);
  const Icon = PILLAR_ICONS[article.pillar];

  return (
    <li ref={rowRef} className={visible ? 'reading visible' : 'reading'} style={{ '--i': index }}>
      <Link to={path} viewTransition={!reducedMotion} className="reading-link">
        <span className="reading-meta">
          <span className="reading-number" aria-hidden="true">
            {String(index + 1).padStart(2, '0')}
          </span>
          <span className="reading-icon">
            <Icon />
          </span>
          <span className="reading-category">{article.category[lang]}</span>
        </span>
        <h3
          className="reading-title"
          style={morphing ? { viewTransitionName: titleTransitionName(article.slug) } : undefined}
        >
          {article.title[lang]}
        </h3>
        <span className="reading-excerpt">{article.excerpt[lang]}</span>
        <span className="reading-read">{t.home.articles.read}</span>
      </Link>
    </li>
  );
}
