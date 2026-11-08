import { useEffect, useRef, type MouseEvent } from 'react';
import { Link } from 'react-router-dom';

import { ARTICLES, articlePath, type Article } from '../../data/articles';
import { useInView } from '../../hooks/useInView';
import { usePrefersReducedMotion } from '../../hooks/usePrefersReducedMotion';
import { useI18n } from '../../i18n';
import { setPageDescription } from '../../lib/pageMeta';
import { setProgressSource } from '../../lib/scrollFrame';
import { PILLAR_ICONS, titleTransitionName } from './pillarIcon';
import './article.css';

/** Legacy article.js: a paragraph rises in once 15% of it is in view. */
const PARAGRAPH_THRESHOLD = 0.15;

/**
 * An article page (ported from the legacy articles/*.html and js/article.js):
 * on paper, the pillar icon, the category and the title, then six paragraphs
 * at a reading measure that rise in as they enter the view (static with
 * reduced motion). The header hairline and the pocket watch follow the reading
 * progress through the text. It ends with the other two articles and the way
 * back to the Readings section.
 */
export function ArticleView({ article }: { article: Article }) {
  const { t, lang } = useI18n();
  const reducedMotion = usePrefersReducedMotion();
  const bodyRef = useRef<HTMLDivElement>(null);
  const Icon = PILLAR_ICONS[article.pillar];
  const title = article.title[lang];
  const others = ARTICLES.filter((other) => other.slug !== article.slug);

  // Reading progress (hairline and watch) runs across the text, not the page.
  useEffect(() => {
    setProgressSource(bodyRef.current);
    return () => {
      setProgressSource(null);
    };
  }, []);

  // Document title and description from the article, in the current language.
  useEffect(() => {
    const previous = document.title;
    document.title = `${title} | Insomnia`;
    setPageDescription(article.excerpt[lang]);
    return () => {
      document.title = previous;
      setPageDescription(null);
    };
  }, [title, article, lang]);

  return (
    <article className="article-page" aria-labelledby="article-title">
      <header className="article-head">
        <span className="article-icon">
          <Icon />
        </span>
        <p className="article-category">{article.category[lang]}</p>
        <h1
          id="article-title"
          className="article-title"
          style={{ viewTransitionName: titleTransitionName(article.slug) }}
        >
          {title}
        </h1>
      </header>

      <div ref={bodyRef} className="article-body">
        {article.paragraphs[lang].map((text, i) => (
          <RevealParagraph key={i} text={text} />
        ))}
      </div>

      <footer className="article-end">
        <nav className="article-more" aria-labelledby="article-more-title">
          <h2 id="article-more-title" className="article-more-title">
            {t.home.articles.more}
          </h2>
          <ul className="article-more-list">
            {others.map((other) => (
              <li key={other.slug}>
                <Link
                  to={articlePath(other.slug)}
                  viewTransition={!reducedMotion}
                  className="article-more-link"
                  onClick={(event) => {
                    nameForMorph(event, other.slug);
                  }}
                >
                  <span className="article-more-category">{other.category[lang]}</span>
                  <span className="article-more-name">{other.title[lang]}</span>
                </Link>
              </li>
            ))}
          </ul>
        </nav>
        <Link
          to={{ pathname: '/', hash: '#lecturas' }}
          viewTransition={!reducedMotion}
          className="article-back"
          aria-label={t.home.articles.back}
        >
          {t.home.articles.backShort}
        </Link>
      </footer>
    </article>
  );
}

/**
 * Names the clicked link's title just before the transition captures the old
 * page, so it morphs into the next article's h1. Only the clicked one is named:
 * the other link keeps no name and never flies across the page.
 */
function nameForMorph(event: MouseEvent<HTMLAnchorElement>, slug: string): void {
  const name = event.currentTarget.querySelector<HTMLElement>('.article-more-name');
  if (name) name.style.viewTransitionName = titleTransitionName(slug);
}

function RevealParagraph({ text }: { text: string }) {
  const [ref, visible] = useInView<HTMLParagraphElement>(PARAGRAPH_THRESHOLD);
  return (
    <p ref={ref} className={visible ? 'article-paragraph visible' : 'article-paragraph'}>
      {text}
    </p>
  );
}
