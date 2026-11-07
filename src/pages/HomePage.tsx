import { useI18n } from '../i18n';
import './PlaceholderPage.css';

/*
 * PLACEHOLDER home page. It only exists so the layout shell can be seen: a
 * dark first screen (where the hero and 3D chain will go) under the
 * transparent header, then a light screen to scroll into so the header's
 * .scrolled state and progress hairline show. Replaced in later steps.
 */
export function HomePage() {
  const { t } = useI18n();

  return (
    <>
      <section className="placeholder placeholder--dark" aria-labelledby="home-placeholder">
        <h1 id="home-placeholder" className="placeholder-label">
          {t.home.placeholder}
        </h1>
      </section>
      <section className="placeholder" aria-hidden="true" />
    </>
  );
}
