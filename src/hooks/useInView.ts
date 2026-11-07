import { useCallback, useState, type RefCallback } from 'react';

/** Legacy thresholds: .observe-fade at 12%, .observe-reveal at 30%. */
export const FADE_THRESHOLD = 0.12;
export const REVEAL_THRESHOLD = 0.3;

/**
 * Port of the legacy .observe-fade / .observe-reveal observers: returns a ref
 * and `visible`, which turns true once the element is `threshold` in view and
 * then stays true (the observer disconnects). One re-render per element, never
 * per scroll. Elements that start in view become visible on mount.
 */
export function useInView<T extends Element>(
  threshold: number = FADE_THRESHOLD,
): [RefCallback<T>, boolean] {
  const [visible, setVisible] = useState(false);

  const ref = useCallback(
    (el: T | null) => {
      if (!el) return;
      if (typeof IntersectionObserver === 'undefined') {
        setVisible(true);
        return;
      }
      const observer = new IntersectionObserver(
        (entries) => {
          if (entries.some((entry) => entry.isIntersecting)) {
            setVisible(true);
            observer.disconnect();
          }
        },
        { threshold },
      );
      observer.observe(el);
      return () => {
        observer.disconnect();
      };
    },
    [threshold],
  );

  return [ref, visible];
}
