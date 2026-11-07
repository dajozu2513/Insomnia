import { CardBack, CardFront, FlipCard, StaticCard } from '../../features/cards/PlayingCard';
import { OvalLink } from '../../features/motifs';
import { useI18n } from '../../i18n';

export function CardSection() {
  const { t } = useI18n();
  const copy = t.lab.card;
  const front = {
    name: copy.sampleName,
    index: copy.sampleIndex,
    illustration: <OvalLink size={88} />,
  };

  return (
    <section className="lab-section" aria-labelledby="lab-card">
      <h2 id="lab-card" className="lab-heading">
        {copy.title}
      </h2>
      <p className="lab-text">{copy.text}</p>

      <div className="lab-cards">
        <figure className="lab-card">
          <StaticCard>
            <CardFront {...front} />
          </StaticCard>
          <figcaption className="lab-specimen-meta">{copy.front}</figcaption>
        </figure>
        <figure className="lab-card">
          <StaticCard>
            <CardBack />
          </StaticCard>
          <figcaption className="lab-specimen-meta">{copy.back}</figcaption>
        </figure>
        <figure className="lab-card">
          <FlipCard {...front} flipLabel={copy.flip} />
          <figcaption className="lab-specimen-meta">{copy.interactive}</figcaption>
        </figure>
      </div>
    </section>
  );
}
