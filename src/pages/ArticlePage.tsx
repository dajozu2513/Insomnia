import { useParams } from 'react-router-dom';

import { findArticle } from '../data/articles';
import { ArticleView } from '../features/readings/ArticleView';
import { NotFoundPage } from './NotFoundPage';

/** /lecturas/:slug, the same slug in both languages; an unknown slug is the 404 page. */
export function ArticlePage() {
  const { slug } = useParams();
  const article = findArticle(slug);
  if (!article) return <NotFoundPage />;
  // Keyed by slug: moving to another article starts a fresh page (reveal, progress)
  return <ArticleView key={article.slug} article={article} />;
}
