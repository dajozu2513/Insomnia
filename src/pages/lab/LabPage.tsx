import { useI18n } from '../../i18n';
import { AtmosphereSection } from './AtmosphereSection';
import { CardSection } from './CardSection';
import { ClockSection } from './ClockSection';
import { LinksSection } from './LinksSection';
import { MotifSection } from './MotifSection';
import { PaletteSection } from './PaletteSection';
import { TypeSection } from './TypeSection';
import './LabPage.css';

/**
 * Internal visual lab (/lab): the design direction rendered piece by piece for
 * review. Not linked from the site and not indexed. Loaded lazily, so none of
 * it ships in the main bundle.
 */
export function LabPage() {
  const { t } = useI18n();
  const copy = t.lab;

  return (
    <div className="lab">
      {/* React hoists these into <head> */}
      <title>{copy.pageTitle}</title>
      <meta name="robots" content="noindex, nofollow" />

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
      <CardSection />
      <AtmosphereSection />
    </div>
  );
}
