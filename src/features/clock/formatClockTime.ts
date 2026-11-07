/*
 * Clock format for the night cycle (docs/brand/design-direction.md): 12-hour,
 * localized, e.g. ES "6:00 p. m.", EN "6:00 PM". Built by hand rather than with
 * Intl.DateTimeFormat so every browser prints exactly the approved strings
 * (engines disagree on "p. m." vs "p.m." and on the space characters).
 */

/** No-break space: the time never wraps between its parts. */
export const NBSP = ' ';

export interface ClockPeriods {
  am: string;
  pm: string;
}

export interface ClockParts {
  /** Hour, 1 to 12, unpadded. */
  hour: string;
  minutes: string;
  period: string;
  /** Full string, e.g. "9:47 p. m." with no-break spaces. */
  text: string;
}

function wrapDay(minutes: number): number {
  return ((Math.round(minutes) % 1440) + 1440) % 1440;
}

/**
 * @param minutesAfterMidnight Any whole number of minutes; wraps around 24 h.
 * @param periods The localized a.m./p.m. labels (from the i18n dictionary).
 */
export function formatClockTime(minutesAfterMidnight: number, periods: ClockPeriods): ClockParts {
  const total = wrapDay(minutesAfterMidnight);
  const h24 = Math.floor(total / 60);
  const hour = String(h24 % 12 === 0 ? 12 : h24 % 12);
  const minutes = String(total % 60).padStart(2, '0');
  const period = (h24 < 12 ? periods.am : periods.pm).replace(/ /g, NBSP);
  return { hour, minutes, period, text: `${hour}:${minutes}${NBSP}${period}` };
}

/** "HH:MM" in 24-hour form, for <time dateTime>. */
export function clockDateTime(minutesAfterMidnight: number): string {
  const total = wrapDay(minutesAfterMidnight);
  const h = String(Math.floor(total / 60)).padStart(2, '0');
  const m = String(total % 60).padStart(2, '0');
  return `${h}:${m}`;
}
