import { useHead } from '../../hooks/useHead';
import { useI18n } from '../../i18n';
import { AtmosphereSection } from './AtmosphereSection';
import { CardSection } from './CardSection';
import { ClockSection } from './ClockSection';
import { LinksSection } from './LinksSection';
import { MotifSection } from './MotifSection';
import { PaletteSection } from './PaletteSection';
import { PrintsSection } from './PrintsSection';
import { TypeSection } from './TypeSection';
import './LabPage.css';

/**
 * Internal visual lab (/lab): the design direction rendered piece by piece for
 * review. Not linked from the site and not indexed. Loaded lazily, so none of
 * it ships in the main bundle.
 */
export function LabPage() {
  const { t, lang } = useI18n();
  const copy = t.lab;
  useHead({
    title: copy.pageTitle,
    description: copy.intro,
    path: '/lab',
    type: 'website',
    lang,
    noindex: true,
  });

  return (
    <div className="lab">
      <header className="lab-hero">
        <p className="lab-eyebrow">{copy.eyebrow}</p>
        <h1 className="lab-title">{copy.title}</h1>
        <p className="lab-intro">{copy.intro}</p>
      </header>

      <PaletteSection />
      <TypeSection />
      <ClockSection />
      <MotifSection />
      <LinksSection />
      <PrintsSection />
      <CardSection />
      <AtmosphereSection />
    </div>
  );
}
