import { useEffect, useState } from 'react';

import { PocketWatch } from '../clock/PocketWatch';
import { useI18n } from '../../i18n';
import { activeDeepLink } from '../product/deepLink';
import '../home/byline.css';
import './IntroSplash.css';

/** sessionStorage key: the splash shows once per tab. */
export const INTRO_SEEN_KEY = 'insomnia-intro-seen';
/** On <html> while the splash covers the page: pauses the hero entrance. */
const PENDING_CLASS = 'intro-pending';
/** The splash holds this long, then lifts (legacy: 2 s). */
const HOLD_MS = 2000;
/** Length of the lift before the splash is removed (legacy: 1 s). */
const LIFT_MS = 1000;

type Phase = 'hidden' | 'showing' | 'lifting';

function alreadySeen(): boolean {
  try {
    // A deep link to a product (?link= or ?tee= with a valid id) goes straight to it: no splash
    if (activeDeepLink()) return true;
    return window.sessionStorage.getItem(INTRO_SEEN_KEY) !== null;
  } catch {
    return true; // no storage: never risk showing it on every load
  }
}

function markSeen(): void {
  try {
    window.sessionStorage.setItem(INTRO_SEEN_KEY, '1');
  } catch {
    // ignore
  }
}

/**
 * Intro splash, ported from the legacy site: the full name "Insomnia by Joel
 * Soto" rises over a slow red mist, a hairline draws
 * outward, the pocket watch fades in at 6:00 (the start of the night), and after 2 s the splash
 * lifts as a clip-path curtain while the hero entrance plays. Once per tab.
 *
 * StrictMode-safe: whether to show is read in the state initializer (pure, so
 * running it twice is harmless) and sessionStorage is written in the effect,
 * whose timers are cleared and restarted by the development double mount.
 * index.html sets `intro-pending` before first paint on a first visit to "/",
 * so the page never flashes before the splash covers it.
 */
export function IntroSplash() {
  const { t } = useI18n();
  const [phase, setPhase] = useState<Phase>(() => (alreadySeen() ? 'hidden' : 'showing'));
  const [shows] = useState(phase !== 'hidden');

  useEffect(() => {
    const root = document.documentElement;
    if (!shows) {
      root.classList.remove(PENDING_CLASS);
      return;
    }
    markSeen();
    root.classList.add(PENDING_CLASS);
    const lift = window.setTimeout(() => {
      root.classList.remove(PENDING_CLASS);
      setPhase('lifting');
    }, HOLD_MS);
    const done = window.setTimeout(() => {
      setPhase('hidden');
    }, HOLD_MS + LIFT_MS);
    return () => {
      window.clearTimeout(lift);
      window.clearTimeout(done);
      root.classList.remove(PENDING_CLASS);
    };
  }, [shows]);

  if (phase === 'hidden') return null;

  return (
    <div
      className={
        phase === 'lifting' ? 'intro-screen atmo-grain fade-out' : 'intro-screen atmo-grain'
      }
      aria-hidden="true"
    >
      {/* The threshold into the night: a slow red mist on ink, the one large use of red */}
      <div className="intro-red-mist" />
      <div className="atmo-vignette" />
      <div className="intro-name">
        <div className="intro-logo">{t.home.hero.title}</div>
        <div className="intro-byline name-byline">{t.home.hero.sub}</div>
      </div>
      <span className="intro-line" />
      {/* The start of the night: the header's watch, larger and static at 6:00 */}
      <PocketWatch className="intro-watch" size={88} progress={0} doubleRim />
    </div>
  );
}
