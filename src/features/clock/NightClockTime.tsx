import { clockDateTime, formatClockTime, NBSP, type ClockPeriods } from './formatClockTime';
import './clock.css';

interface NightClockTimeProps {
  /** Minutes after midnight. */
  minutes: number;
  /** Localized a.m./p.m. labels: t.clock */
  periods: ClockPeriods;
  className?: string;
}

/**
 * A night-clock reading whose layout never moves. The hour sits in a slot as
 * wide as "00" in tabular figures (an invisible "00" sizes it), so the colon
 * and minutes stay put from 9:59 to 10:00; the whole reading sits in a
 * fixed-width box (clock.css). Screen readers get the plain text once.
 */
export function NightClockTime({ minutes, periods, className }: NightClockTimeProps) {
  const time = formatClockTime(minutes, periods);
  return (
    <time
      className={className ? `night-clock ${className}` : 'night-clock'}
      dateTime={clockDateTime(minutes)}
    >
      <span className="visually-hidden">{time.text}</span>
      <span className="night-clock-face" aria-hidden="true">
        <span className="night-clock-hour">
          <span className="night-clock-sizer">00</span>
          <span>{time.hour}</span>
        </span>
        :{time.minutes}
        {NBSP}
        {time.period}
      </span>
    </time>
  );
}
