import { LINKS } from '../../data/links';
import { VoidLink } from '../../features/deck/linkArt';
import { LINK_ART } from '../../features/deck/linkArtMap';
import { useI18n } from '../../i18n';

/** Card-face and corner-index sizes, as on the deck. */
const SIZES = [
  { px: 96, label: 'cardSize' },
  { px: 14, label: 'indexSize' },
] as const;

export function LinksSection() {
  const { t } = useI18n();
  const copy = t.lab.links;

  return (
    <section className="lab-section" aria-labelledby="lab-links">
      <h2 id="lab-links" className="lab-heading">
        {copy.title}
      </h2>
      <p className="lab-text">{copy.text}</p>

      {SIZES.map(({ px, label }) => (
        <div key={px} className="lab-links-row">
          <p className="lab-specimen-meta">
            {copy[label]} ({px} px)
          </p>
          <ul className="lab-links">
            {LINKS.map((link) => {
              const Art = LINK_ART[link.id] ?? VoidLink;
              return (
                <li key={link.id} className="lab-link">
                  <Art size={px} />
                  <span className="lab-link-name">
                    {link.rank} {link.name}
                  </span>
                </li>
              );
            })}
          </ul>
        </div>
      ))}
    </section>
  );
}
