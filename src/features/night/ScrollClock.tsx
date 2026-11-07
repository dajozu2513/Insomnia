import { useEffect, useRef } from 'react';

import { formatClockTime, NBSP } from '../clock/formatClockTime';
import '../clock/clock.css';
import { useI18n } from '../../i18n';
import { nightMinutesAt, subscribeNightProgress } from './night';

/**
 * The header's night clock: 6:00 PM at the top of the page, 6:00 AM at the
 * bottom, in one-minute steps. Same markup and fixed-width formatting as
 * <NightClockTime>, but its text is written through refs inside the shared
 * scroll frame, so scrolling never re-renders React. Decorative: aria-hidden.
 */
export function ScrollClock() {
  const { t } = useI18n();
  const periods = t.clock;
  const hourRef = useRef<HTMLSpanElement>(null);
  const restRef = useRef<HTMLSpanElement>(null);

  // Re-subscribing on a language change redraws the time at once in the new locale.
  useEffect(() => {
    let lastMinutes = -1;
    return subscribeNightProgress((progress) => {
      const minutes = nightMinutesAt(progress);
      if (minutes === lastMinutes) return;
      lastMinutes = minutes;
      const time = formatClockTime(minutes, periods);
      if (hourRef.current) hourRef.current.textContent = time.hour;
      if (restRef.current) restRef.current.textContent = `:${time.minutes}${NBSP}${time.period}`;
    });
  }, [periods]);

  return (
    <span className="night-clock scroll-clock" aria-hidden="true">
      <span className="night-clock-hour">
        <span className="night-clock-sizer">00</span>
        <span ref={hourRef} />
      </span>
      <span ref={restRef} />
    </span>
  );
}
