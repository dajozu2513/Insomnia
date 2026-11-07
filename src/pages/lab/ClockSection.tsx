import { useEffect, useRef, useState } from 'react';

import { NightClockTime } from '../../features/clock/NightClockTime';
import { dictionaries } from '../../i18n/dictionaries';
import { LANGS, useI18n } from '../../i18n';

/** Sample times, in minutes after midnight. 9:59 PM and 10:00 PM prove the width holds. */
const TIMES = [18 * 60, 21 * 60 + 47, 21 * 60 + 59, 22 * 60, 0, 3 * 60 + 47, 6 * 60];

export function ClockSection() {
  const { t } = useI18n();
  const copy = t.lab.clock;
  const listRef = useRef<HTMLDivElement>(null);
  const [widths, setWidths] = useState<Record<string, number>>({});

  // Measure every rendered time (also after the web fonts arrive) to show the width holds.
  useEffect(() => {
    const list = listRef.current;
    if (!list) return;
    const measure = () => {
      const next: Record<string, number> = {};
      list.querySelectorAll<HTMLElement>('[data-clock-key]').forEach((row) => {
        const clock = row.querySelector('.night-clock');
        if (clock) next[row.dataset.clockKey ?? ''] = clock.getBoundingClientRect().width;
      });
      setWidths(next);
    };
    const observer = new ResizeObserver(measure);
    list.querySelectorAll('.night-clock').forEach((el) => {
      observer.observe(el);
    });
    void document.fonts.ready.then(measure);
    return () => {
      observer.disconnect();
    };
  }, []);

  return (
    <section className="lab-section" aria-labelledby="lab-clock">
      <h2 id="lab-clock" className="lab-heading">
        {copy.title}
      </h2>
      <p className="lab-text">{copy.text}</p>

      <div ref={listRef} className="lab-clock-grid">
        {LANGS.map((lang) => (
          <div key={lang} className="lab-clock-column" lang={lang}>
            <p className="lab-specimen-meta">{lang.toUpperCase()}</p>
            {TIMES.map((minutes) => {
              const key = `${lang}-${String(minutes)}`;
              const width = widths[key];
              return (
                <div key={key} className="lab-clock-row" data-clock-key={key}>
                  <NightClockTime minutes={minutes} periods={dictionaries[lang].clock} />
                  <span className="lab-clock-width">
                    {width === undefined ? '' : `${copy.measured}: ${width.toFixed(2)} px`}
                  </span>
                </div>
              );
            })}
          </div>
        ))}
      </div>
    </section>
  );
}
