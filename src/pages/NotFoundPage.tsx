import { Link, useLocation } from 'react-router-dom';

import { PocketWatch } from '../features/clock/PocketWatch';
import { useHead } from '../hooks/useHead';
import { useI18n } from '../i18n';
import './NotFoundPage.css';

/** The watch stopped at 3:47 in the morning: 9 h 47 min into the 12-hour night. */
const STOPPED_AT = 587 / 720;
const WATCH_SIZE = 96;

/** 404: an hour that does not exist. Not indexed. */
export function NotFoundPage() {
  const { t, lang } = useI18n();
  const { pathname } = useLocation();
  useHead({
    title: `${t.notFound.title} | Insomnia`,
    description: t.notFound.text,
    path: pathname,
    type: 'website',
    lang,
    noindex: true,
  });

  return (
    <section className="not-found" aria-labelledby="not-found-title">
      <PocketWatch size={WATCH_SIZE} progress={STOPPED_AT} doubleRim className="not-found-watch" />
      <h1 id="not-found-title" className="not-found-title">
        {t.notFound.title}
      </h1>
      <p className="not-found-text">{t.notFound.text}</p>
      <Link to="/" className="not-found-link">
        {t.notFound.back}
      </Link>
    </section>
  );
}
