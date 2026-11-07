import { Link } from 'react-router-dom';

import { useI18n } from '../i18n';
import './PlaceholderPage.css';

export function NotFoundPage() {
  const { t } = useI18n();

  return (
    <section className="placeholder placeholder--dark" aria-labelledby="not-found-title">
      <h1 id="not-found-title" className="placeholder-label">
        {t.notFound.title}
      </h1>
      <Link to="/" className="placeholder-link">
        {t.notFound.back}
      </Link>
    </section>
  );
}
