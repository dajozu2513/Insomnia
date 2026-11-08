import { useCallback, useEffect, useRef, useState, type RefCallback } from 'react';

import { readDeepLink, writeDeepLink, type DeepLinkParam } from './deepLink';

interface OpenState<T> {
  item: T;
  /** The grid element the dialog's product flies from (null for a deep link: no FLIP). */
  source: HTMLElement | null;
}

/**
 * Open state for a grid of products and its dialog: opens from the deep link
 * on load, keeps the URL parameter in sync, remembers where each product sits
 * in the grid (the FLIP source) and returns focus to the product's button once
 * the dialog has closed (and the page is no longer inert).
 *
 *   const dialog = useProductDialog('tee', findTee);
 *   <button ref={dialog.triggerRef(tee.id)} onClick={() => dialog.openItem(tee)}>
 *     <span ref={dialog.sourceRef(tee.id)}>...</span>
 *   </button>
 *   {dialog.open && <TeeDialog key={dialog.open.item.id} ... onClose={dialog.closeItem} />}
 */
export function useProductDialog<T extends { id: string }>(
  param: DeepLinkParam,
  find: (id: string | undefined) => T | undefined,
) {
  const [open, setOpen] = useState<OpenState<T> | undefined>(() => {
    const item = find(readDeepLink(param));
    return item ? { item, source: null } : undefined;
  });
  const triggers = useRef(new Map<string, HTMLElement>());
  const sources = useRef(new Map<string, HTMLElement>());

  const openItem = useCallback(
    (item: T) => {
      setOpen({ item, source: sources.current.get(item.id) ?? null });
      writeDeepLink(param, item.id);
    },
    [param],
  );

  const returnFocusTo = useRef<string | null>(null);
  const closeItem = useCallback(() => {
    returnFocusTo.current = open?.item.id ?? null;
    setOpen(undefined);
    writeDeepLink(param, null);
  }, [open, param]);

  useEffect(() => {
    if (open || !returnFocusTo.current) return;
    triggers.current.get(returnFocusTo.current)?.focus();
    returnFocusTo.current = null;
  }, [open]);

  const register = useCallback(
    (map: Map<string, HTMLElement>, id: string): RefCallback<HTMLElement> =>
      (el) => {
        if (el) map.set(id, el);
        else map.delete(id);
      },
    [],
  );

  const triggerRef = useCallback((id: string) => register(triggers.current, id), [register]);
  const sourceRef = useCallback((id: string) => register(sources.current, id), [register]);

  return { open, openItem, closeItem, triggerRef, sourceRef };
}
