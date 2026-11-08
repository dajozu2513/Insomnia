import { findLink } from '../../data/links';
import { findTee } from '../../data/tees';

/*
 * Deep links to a product dialog: ?link=<id> (a jewelry card) and ?tee=<id>
 * (a T-shirt). One dialog opens at a time, so the parameters never conflict:
 * on load the first valid one in this order wins and the others are ignored;
 * opening a dialog writes its own parameter and removes the others; closing
 * removes them all. Unknown ids are ignored. Changes use replaceState, so they
 * add no history entries.
 */
const PARAMS = {
  link: (id: string) => findLink(id) !== undefined,
  tee: (id: string) => findTee(id) !== undefined,
} as const;

export type DeepLinkParam = keyof typeof PARAMS;

const ORDER = Object.keys(PARAMS) as DeepLinkParam[];

/** The deep link the page was opened with, if it names a real product. */
export function activeDeepLink(): { param: DeepLinkParam; id: string } | undefined {
  try {
    const params = new URLSearchParams(window.location.search);
    for (const param of ORDER) {
      const id = params.get(param);
      if (id && PARAMS[param](id)) return { param, id };
    }
  } catch {
    // No usable location: no deep link
  }
  return undefined;
}

/** The id for `param` when it is the active deep link. */
export function readDeepLink(param: DeepLinkParam): string | undefined {
  const active = activeDeepLink();
  return active?.param === param ? active.id : undefined;
}

/** Points the URL at an open dialog (or at none, with null). */
export function writeDeepLink(param: DeepLinkParam, id: string | null): void {
  const url = new URL(window.location.href);
  for (const other of ORDER) url.searchParams.delete(other);
  if (id) url.searchParams.set(param, id);
  window.history.replaceState(window.history.state, '', url);
}
