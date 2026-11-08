import type { ComponentType } from 'react';

import type { Pillar } from '../../data/articles';
import { LinkIcon, MoonIcon, QuoteIcon } from '../home/PillarIcons';

/** Each article's pillar, drawn with the home pillar icons (static, never self-drawing here). */
export const PILLAR_ICONS: Record<Pillar, ComponentType> = {
  steel: LinkIcon,
  words: QuoteIcon,
  vigil: MoonIcon,
};

/** The view-transition name an index title and its article's h1 share. */
export function titleTransitionName(slug: string): string {
  return `article-${slug}`;
}
