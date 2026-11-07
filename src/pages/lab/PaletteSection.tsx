import { useState } from 'react';

import { useI18n } from '../../i18n';
import { contrastRatio, parseHex, readToken } from './contrast';

type RoleKey =
  | 'ink'
  | 'inkRaised'
  | 'bone'
  | 'boneDeep'
  | 'textOnDark'
  | 'textOnDarkMuted'
  | 'textOnLight'
  | 'textOnLightMuted'
  | 'steel'
  | 'accent'
  | 'accentGlow';

const SWATCHES: readonly { token: string; role: RoleKey }[] = [
  { token: '--ink', role: 'ink' },
  { token: '--ink-raised', role: 'inkRaised' },
  { token: '--bone', role: 'bone' },
  { token: '--bone-deep', role: 'boneDeep' },
  { token: '--text-on-dark', role: 'textOnDark' },
  { token: '--text-on-dark-muted', role: 'textOnDarkMuted' },
  { token: '--text-on-light', role: 'textOnLight' },
  { token: '--text-on-light-muted', role: 'textOnLightMuted' },
  { token: '--steel', role: 'steel' },
  { token: '--accent', role: 'accent' },
  { token: '--accent-glow', role: 'accentGlow' },
];

const BACKGROUNDS = [
  { token: '--ink', side: 'dark' },
  { token: '--ink-raised', side: 'dark' },
  { token: '--bone', side: 'light' },
  { token: '--bone-deep', side: 'light' },
] as const;

type Use = 'text' | 'graphic' | 'none';

/** How each foreground is meant to be used on each side (design direction rules). */
const FOREGROUNDS: readonly { token: string; dark: Use; light: Use }[] = [
  { token: '--text-on-dark', dark: 'text', light: 'none' },
  { token: '--text-on-dark-muted', dark: 'text', light: 'none' },
  { token: '--steel', dark: 'graphic', light: 'none' },
  { token: '--text-on-light', dark: 'none', light: 'text' },
  { token: '--text-on-light-muted', dark: 'none', light: 'text' },
  // Red text only on light; on dark it is light or glow, never text.
  { token: '--accent', dark: 'none', light: 'text' },
];

type Verdict = 'pass' | 'passLarge' | 'passGraphic' | 'fail' | 'notUsed';

function verdict(ratio: number, use: Use): Verdict {
  if (use === 'none') return 'notUsed';
  if (use === 'graphic') return ratio >= 3 ? 'passGraphic' : 'fail';
  if (ratio >= 4.5) return 'pass';
  if (ratio >= 3) return 'passLarge';
  return 'fail';
}

function readAll(): Record<string, string> {
  const tokens = new Set([...SWATCHES.map((s) => s.token), ...BACKGROUNDS.map((b) => b.token)]);
  return Object.fromEntries([...tokens].map((token) => [token, readToken(token)]));
}

export function PaletteSection() {
  const { t } = useI18n();
  const copy = t.lab.palette;
  // Tokens are static for the page's lifetime; read them once, as the browser resolved them.
  const [values] = useState(readAll);

  return (
    <section className="lab-section" aria-labelledby="lab-palette">
      <h2 id="lab-palette" className="lab-heading">
        {copy.title}
      </h2>
      <p className="lab-text">{copy.text}</p>

      <ul className="lab-swatches">
        {SWATCHES.map(({ token, role }) => (
          <li key={token} className="lab-swatch">
            <span className="lab-swatch-chip" style={{ background: `var(${token})` }} />
            <code className="lab-swatch-token">{token}</code>
            <span className="lab-swatch-value">{values[token]}</span>
            <span className="lab-swatch-role">{copy.roles[role]}</span>
          </li>
        ))}
      </ul>

      <h3 className="lab-subheading">{copy.contrastTitle}</h3>
      <p className="lab-text">{copy.contrastText}</p>
      <div className="lab-table-wrap">
        <table className="lab-contrast">
          <thead>
            <tr>
              <th scope="col">{copy.textColumn}</th>
              {BACKGROUNDS.map(({ token }) => (
                <th key={token} scope="col" style={{ background: `var(${token})` }}>
                  <code>{token}</code>
                </th>
              ))}
            </tr>
          </thead>
          <tbody>
            {FOREGROUNDS.map((fg) => (
              <tr key={fg.token}>
                <th scope="row">
                  <code>{fg.token}</code>
                </th>
                {BACKGROUNDS.map((bg) => {
                  const a = parseHex(values[fg.token] ?? '');
                  const b = parseHex(values[bg.token] ?? '');
                  const ratio = a && b ? contrastRatio(a, b) : 0;
                  const result = verdict(ratio, fg[bg.side]);
                  return (
                    <td
                      key={bg.token}
                      className={`lab-cell lab-cell--${result}`}
                      style={{ background: `var(${bg.token})`, color: `var(${fg.token})` }}
                    >
                      <span className="lab-cell-ratio">{ratio.toFixed(2)}:1</span>
                      <span className="lab-cell-verdict">{copy[result]}</span>
                    </td>
                  );
                })}
              </tr>
            ))}
          </tbody>
        </table>
      </div>
    </section>
  );
}
