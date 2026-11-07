/*
 * Types shared by the chain's React layer and its engine. This file must not
 * import three: it is loaded with the main bundle, and three.js belongs in the
 * engine's own chunk.
 */

/** The page elements the chain is built around: its "windows". */
export interface ChainAnchors {
  /** The hero section the necklace frames. */
  hero: HTMLElement | null;
  /** The transparent bands the chain drapes across, in document order. */
  bands: readonly HTMLElement[];
}

export interface ChainSceneOptions {
  /** Read on every rebuild, so the path always follows the live layout. */
  getAnchors: () => ChainAnchors;
  /** Initial reduced-motion preference; update it with setReducedMotion(). */
  reducedMotion: boolean;
  /**
   * The night cycle (features/night/night.ts), passed in so the engine stays
   * free of app imports: `subscribe` calls back inside the shared scroll frame.
   */
  night: {
    get: () => number;
    subscribe: (listener: (progress: number) => void) => () => void;
  };
  /** Called once, on the frame after the first draw (fades the canvas in). */
  onReady?: () => void;
}

export interface ChainScene {
  /** Re-measure the stage and anchors and rebuild the path. */
  rebuild: () => void;
  setReducedMotion: (reduced: boolean) => void;
  /** Stops everything and frees every GPU resource. Safe to call twice. */
  dispose: () => void;
}
