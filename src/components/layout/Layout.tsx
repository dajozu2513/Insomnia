import { Outlet, ScrollRestoration, useMatch } from 'react-router-dom';

import { useI18n } from '../../i18n';
import { Footer } from './Footer';
import { Header } from './Header';

export function Layout() {
  const { t } = useI18n();
  // On the home page the footer sits over the landing's last frame
  const home = useMatch('/') !== null;

  return (
    <>
      <a className="skip-link" href="#main">
        {t.a11y.skipToContent}
      </a>
      <Header />
      <main id="main" tabIndex={-1}>
        <Outlet />
      </main>
      <Footer overScene={home} />
      <ScrollRestoration />
    </>
  );
}
