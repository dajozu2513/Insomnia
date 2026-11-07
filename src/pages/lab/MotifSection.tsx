import { Chessboard, ClockFace, FiligreeDivider, Key, Rose } from '../../features/motifs';
import { useI18n } from '../../i18n';

const GROUNDS = ['ink', 'bone'] as const;

export function MotifSection() {
  const { t } = useI18n();
  const copy = t.lab.motifs;

  return (
    <section className="lab-section" aria-labelledby="lab-motifs">
      <h2 id="lab-motifs" className="lab-heading">
        {copy.title}
      </h2>
      <p className="lab-text">{copy.text}</p>

      {GROUNDS.map((ground) => (
        <ul key={ground} className={`lab-motifs lab-motifs--${ground}`}>
          <li className="lab-motif">
            <Chessboard size={72} fillOpacity={ground === 'ink' ? 0.5 : 0.85} />
            <span className="lab-motif-name">{copy.chessboard}</span>
          </li>
          <li className="lab-motif lab-motif--wide">
            <FiligreeDivider size={240} />
            <span className="lab-motif-name">{copy.filigree}</span>
          </li>
          <li className="lab-motif">
            <Rose size={72} />
            <span className="lab-motif-name">{copy.rose}</span>
          </li>
          <li className="lab-motif">
            <Key size={72} />
            <span className="lab-motif-name">{copy.key}</span>
          </li>
          <li className="lab-motif">
            <ClockFace size={72} />
            <span className="lab-motif-name">{copy.clockFace}</span>
          </li>
        </ul>
      ))}
    </section>
  );
}
