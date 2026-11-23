/*
 * The jewelry preview's interface (three-free, so the app can import its types).
 */

/** What the preview shows: link id, form id and the chain's length in cm. */
export interface PieceSpec {
  link: string;
  form: string;
  length: number;
}

export interface PiecePreviewOptions {
  reducedMotion: boolean;
  /** Small screens: simpler link geometry. */
  small: boolean;
  /** WebGL was lost: the dialog shows the card again. */
  onFailed?: () => void;
}

export interface PiecePreview {
  /** Changes the piece: a new link crossfades in, a new form or length slides the links. */
  set: (spec: PieceSpec) => void;
  /** Whether the piece is on show (the loop runs only then). */
  setActive: (on: boolean) => void;
  setReducedMotion: (reduced: boolean) => void;
  /** Frees the renderer and every geometry, material and texture. Safe to call twice. */
  dispose: () => void;
}

export type CreatePiecePreview = (host: HTMLElement, options: PiecePreviewOptions) => PiecePreview;
