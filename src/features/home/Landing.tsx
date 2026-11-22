import { useCallback, useEffect, useRef } from 'react';

import { useChainLandingRef } from '../chain';
import { useI18n } from '../../i18n';
import { subscribeScrollFrame } from '../../lib/scrollFrame';
import './Landing.css';

/** Landing progress past which the small door is there, under the button. */
const DOOR_SHOWN = 0.94;

/** Scroll to the very bottom of the page at once (the landing's last frame). */
function toBottom(): void {
  window.scrollTo({ top: document.documentElement.scrollHeight, behavior: 'instant' });
}

/**
 * The landing (docs/brand/design-direction.md, "The landing"): the last window
 * onto the scene, at the bottom of the page. While it scrolls, the fall ends in
 * the hall: it appears below upside down, turns over once and the visitor
 * settles on the chessboard floor at dawn, facing a small door. The footer sits
 * over its last frame.
 *
 * The small door is a real button over the 3D door (the engine writes where it
 * shows: --door-x, --door-y, --door-w, --door-h on the section): "Fall again"
 * jumps back to the top of the page at once, to fall again. It is always in the
 * tab order; focusing it scrolls to the last frame, where the door is.
 */
export function Landing() {
  const { t } = useI18n();
  const landingRef = useChainLandingRef();
  const sectionRef = useRef<HTMLElement | null>(null);
  const doorRef = useRef<HTMLButtonElement>(null);

  const ref = useCallback(
    (el: HTMLElement | null) => {
      sectionRef.current = el;
      const cleanup = landingRef(el);
      return () => {
        sectionRef.current = null;
        if (typeof cleanup === 'function') cleanup();
      };
    },
    [landingRef],
  );

  // The door button shows once the visitor stands in front of the small door
  useEffect(
    () =>
      subscribeScrollFrame(({ viewportHeight }) => {
        const section = sectionRef.current;
        const door = doorRef.current;
        if (!section || !door) return;
        const start = section.getBoundingClientRect().top + window.scrollY;
        const length = document.documentElement.scrollHeight - viewportHeight - start;
        const progress = length < 1 ? 1 : (window.scrollY - start) / length;
        door.classList.toggle('is-open', progress > DOOR_SHOWN);
      }),
    [],
  );

  const fallAgain = () => {
    window.scrollTo({ top: 0, behavior: 'instant' });
    // Focus goes back to the top with the visitor: the start of the main content
    document.getElementById('main')?.focus({ preventScroll: true });
  };

  const onFocus = () => {
    const end = document.documentElement.scrollHeight - window.innerHeight;
    if (window.scrollY < end - 2) toBottom();
  };

  return (
    <section ref={ref} className="landing">
      <div className="landing-pin">
        <div className="landing-still" aria-hidden="true" />
        <button
          ref={doorRef}
          type="button"
          className="landing-door"
          onClick={fallAgain}
          onFocus={onFocus}
        >
          <span className="landing-door-label">{t.home.landing.fallAgain}</span>
        </button>
      </div>
    </section>
  );
}
