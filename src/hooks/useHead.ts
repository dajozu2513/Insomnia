import { useEffect } from 'react';

import { applyHead, type HeadValues } from '../lib/head';

/**
 * Sets the route's head tags (title, description, canonical, Open Graph,
 * Twitter, robots, page JSON-LD) and updates them when any value changes,
 * e.g. with the language.
 */
export function useHead(values: HeadValues): void {
  const key = JSON.stringify(values);
  useEffect(() => {
    applyHead(JSON.parse(key) as HeadValues);
  }, [key]);
}
