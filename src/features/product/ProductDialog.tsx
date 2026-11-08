import { useCallback, useLayoutEffect, useRef, useState, type ReactNode } from 'react';

import { usePrefersReducedMotion } from '../../hooks/usePrefersReducedMotion';
import { useI18n } from '../../i18n';
import './dialog.css';

/** Legacy timings: the product flies in for 750 ms, the dialog fades out in 350 ms. */
const FLIP_MS = 750;
const CLOSE_MS = 350;

interface ProductDialogProps {
  /** Modifier class, e.g. "product-dialog--tee": sizes the flying element and adds details. */
  className: string;
  /** Id of the heading that names the dialog (the product's name). */
  labelledBy: string;
  /** The grid element the product flies from (null: no FLIP, e.g. for deep links). */
  source: HTMLElement | null;
  onClose: () => void;
  /** The product, large, on the left (stacked on phones); it flies in from the grid. */
  media: ReactNode;
  /** Controls under the media (the T-shirt's front/back toggle). */
  mediaFooter?: ReactNode;
  /** The texts and the configurator. */
  children: ReactNode;
}

/**
 * The product dialog (jewelry cards and T-shirts), ported from the legacy
 * product modal: a native modal <dialog> on the page's paper, the product large
 * on the left and its texts and configurator on the right. The product flies in
 * from the grid (FLIP, skipped with reduced motion or when its source is off
 * screen); overlay and panel animate only their background colour, so the
 * flying product never fades. showModal() gives aria-modal, moves focus in and
 * makes the page inert (focus stays inside); Escape and a click on the backdrop
 * close it with a fade; the page behind does not scroll. Mount it keyed by the
 * product id: it opens once per mount.
 */
export function ProductDialog({
  className,
  labelledBy,
  source,
  onClose,
  media,
  mediaFooter,
  children,
}: ProductDialogProps) {
  const { t } = useI18n();
  const reducedMotion = usePrefersReducedMotion();
  const dialogRef = useRef<HTMLDialogElement>(null);
  const flyRef = useRef<HTMLDivElement>(null);
  const [closing, setClosing] = useState(false);

  // Open as a modal, lock the page behind, and fly the product in from the grid.
  useLayoutEffect(() => {
    const dialog = dialogRef.current;
    if (!dialog) return;
    if (!dialog.open) dialog.showModal();
    const root = document.documentElement;
    const previousOverflow = root.style.overflow;
    root.style.overflow = 'hidden';

    let animation: Animation | undefined;
    const fly = flyRef.current;
    const from = source?.getBoundingClientRect();
    const onScreen = from && from.bottom > 0 && from.top < window.innerHeight && from.width > 0;
    if (fly && from && onScreen && !reducedMotion) {
      const to = fly.getBoundingClientRect();
      animation = fly.animate(
        [
          {
            transformOrigin: 'top left',
            transform: `translate(${String(from.left - to.left)}px, ${String(from.top - to.top)}px) scale(${String(from.width / to.width)})`,
          },
          { transformOrigin: 'top left', transform: 'none' },
        ],
        { duration: FLIP_MS, easing: 'cubic-bezier(0.16, 1, 0.3, 1)' },
      );
    }

    return () => {
      animation?.cancel();
      root.style.overflow = previousOverflow;
      if (dialog.open) dialog.close();
    };
    // Runs once per dialog (the component is keyed by the product id)
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, []);

  const requestClose = useCallback(() => {
    if (closing) return;
    setClosing(true);
    window.setTimeout(onClose, reducedMotion ? 0 : CLOSE_MS);
  }, [closing, onClose, reducedMotion]);

  return (
    <dialog
      ref={dialogRef}
      className={`product-dialog ${className}${closing ? ' is-closing' : ''}`}
      aria-labelledby={labelledBy}
      aria-modal="true"
      onCancel={(event) => {
        event.preventDefault(); // Escape: close with the fade
        requestClose();
      }}
      onClick={(event) => {
        if (event.target === event.currentTarget) requestClose(); // the backdrop
      }}
    >
      <div className="product-dialog-panel">
        <button
          type="button"
          className="product-dialog-close"
          aria-label={t.home.product.close}
          onClick={requestClose}
        >
          &times;
        </button>

        <div className="product-dialog-media">
          <div ref={flyRef} className="product-dialog-fly">
            {media}
          </div>
          {mediaFooter}
        </div>

        <div className="product-dialog-body">{children}</div>
      </div>
    </dialog>
  );
}
