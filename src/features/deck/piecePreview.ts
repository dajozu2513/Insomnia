import type { CreatePiecePreview } from '../chain/engine/piece/types';

let loader: Promise<CreatePiecePreview> | null = null;

/** The preview's code: its own chunk, fetched once, when a jewelry dialog first opens. */
export function loadPiecePreview(): Promise<CreatePiecePreview> {
  loader ??= import('../chain/engine/piece/createPiecePreview').then(
    (module) => module.createPiecePreview,
  );
  loader.catch(() => {
    loader = null; // a later dialog may try again
  });
  return loader;
}

/** Set before first paint by index.html when WebGL exists (the same test as the page's scene). */
export function canPreviewPiece(): boolean {
  return document.documentElement.classList.contains('has-3d');
}
