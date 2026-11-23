import { useEffect, useRef, useState } from 'react';

import type { ChainLink } from '../../data/links';
import { usePrefersReducedMotion } from '../../hooks/usePrefersReducedMotion';
import type { CreatePiecePreview, PiecePreview, PieceSpec } from '../chain/engine/piece/types';
import { loadPiecePreview } from './piecePreview';
import { CardFront } from './CardFaces';

interface PieceFlipProps {
  link: ChainLink;
  /** What to show; null until a form is chosen (the renderer is created then). */
  spec: PieceSpec | null;
  /** The card turned over, showing the piece. */
  showPiece: boolean;
  /** The 3D window's accessible name. */
  label: string;
  /** The preview could not load or lost WebGL: the dialog keeps the card. */
  onUnavailable: () => void;
}

/**
 * The card in the jewelry dialog: as dealt on opening; turned over (the deck's
 * slow flip), its back is a small 3D window showing the piece. The renderer is
 * created the first time it is needed and freed when the dialog closes.
 */
export function PieceFlip({ link, spec, showPiece, label, onUnavailable }: PieceFlipProps) {
  const reducedMotion = usePrefersReducedMotion();
  const hostRef = useRef<HTMLSpanElement>(null);
  const previewRef = useRef<PiecePreview | null>(null);
  const [create, setCreate] = useState<CreatePiecePreview | null>(null);
  const latest = useRef({ spec, showPiece, reducedMotion, onUnavailable });
  useEffect(() => {
    latest.current = { spec, showPiece, reducedMotion, onUnavailable };
  });

  // Fetch the code as the dialog opens, so it is ready when a form is chosen
  useEffect(() => {
    let cancelled = false;
    loadPiecePreview()
      .then((fn) => {
        if (!cancelled) setCreate(() => fn);
      })
      .catch(() => {
        if (!cancelled) latest.current.onUnavailable();
      });
    return () => {
      cancelled = true;
    };
  }, []);

  // The renderer: created when the piece is first needed, freed with the dialog
  const needed = spec !== null;
  useEffect(() => {
    const host = hostRef.current;
    if (!create || !needed || !host) return;
    let preview: PiecePreview;
    try {
      preview = create(host, {
        reducedMotion: latest.current.reducedMotion,
        small: window.innerWidth <= 700,
        onFailed: () => {
          latest.current.onUnavailable();
        },
      });
    } catch {
      latest.current.onUnavailable();
      return;
    }
    previewRef.current = preview;
    const first = latest.current;
    if (first.spec) preview.set(first.spec);
    preview.setActive(first.showPiece);
    return () => {
      preview.dispose();
      previewRef.current = null;
    };
  }, [create, needed]);

  const linkId = spec?.link;
  const formId = spec?.form;
  const length = spec?.length;
  useEffect(() => {
    if (linkId && formId && length !== undefined) {
      previewRef.current?.set({ link: linkId, form: formId, length });
    }
  }, [linkId, formId, length]);

  useEffect(() => {
    previewRef.current?.setActive(showPiece);
  }, [showPiece]);

  useEffect(() => {
    previewRef.current?.setReducedMotion(reducedMotion);
  }, [reducedMotion]);

  return (
    <span className={showPiece ? 'piece-flip is-piece' : 'piece-flip'}>
      <span className="piece-flip-inner">
        <CardFront link={link} />
        <span
          ref={hostRef}
          className="deck-face piece-window"
          role="img"
          aria-label={label}
          aria-hidden={showPiece ? undefined : true}
        />
      </span>
    </span>
  );
}
