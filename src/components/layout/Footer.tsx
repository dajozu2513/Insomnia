import { useI18n } from '../../i18n';
import './Footer.css';

export function Footer() {
  const { t } = useI18n();
  const year = new Date().getFullYear();

  return (
    <footer className="site-footer">
      <div className="footer-signature">
        <p className="footer-brand">{t.meta.siteName}</p>
        <p className="footer-tagline">{t.footer.tagline}</p>
      </div>
      <p className="footer-copy">
        &copy; {year} &bull; {t.footer.rights}
      </p>
    </footer>
  );
}
