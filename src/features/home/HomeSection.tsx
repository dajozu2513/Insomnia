import type { ReactNode } from 'react';

import { FADE_THRESHOLD, REVEAL_THRESHOLD, useInView } from '../../hooks/useInView';
import './HomeSection.css';

interface HomeSectionProps {
  id: string;
  /** Roman lead of the heading. */
  lead: string;
  /** Italic tail of the heading (legacy two-part titles); empty for none. */
  em: string;
  children: ReactNode;
}

/**
 * A reality section (bone, opaque, so it covers the chain): heading in the
 * legacy style (roman lead, italic tail, rising out of its slot) over its content.
 */
export function HomeSection({ id, lead, em, children }: HomeSectionProps) {
  const [headerRef, headerVisible] = useInView<HTMLElement>(FADE_THRESHOLD);
  const [titleRef, titleVisible] = useInView<HTMLHeadingElement>(REVEAL_THRESHOLD);

  return (
    <section className="home-section" aria-labelledby={`${id}-title`}>
      <header
        ref={headerRef}
        className={headerVisible ? 'section-header visible' : 'section-header'}
      >
        <h2
          ref={titleRef}
          id={`${id}-title`}
          className={titleVisible ? 'section-title visible' : 'section-title'}
        >
          <span className="reveal-wrap">
            <span className="reveal-line">
              {lead}
              {em && (
                <>
                  {' '}
                  <em>{em}</em>
                </>
              )}
            </span>
          </span>
        </h2>
      </header>
      {children}
    </section>
  );
}
