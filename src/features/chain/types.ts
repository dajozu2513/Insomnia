/*
 * Types shared by the chain's React layer and its engine. This file must not
 * import three: it is loaded with the main bundle, and three.js belongs in the
 * engine's own chunk.
 */

/** The page elements the chain is built around: its "windows". */
export interface ChainAnchors {
  /** The hero section: the entrance and the fall play while it scrolls. */
  hero: HTMLElement | null;
  /** Every transparent band (a window onto the shaft), in document order. */
  bands: readonly HTMLElement[];
  /** The bands the chain drapes across (band 1 only, for now), in document order. */
  chainBands: readonly HTMLElement[];
  /**
   * The landing at the bottom of the page: the fall ends in the hall while it
   * scrolls. The engine writes the small door's place on screen to it as CSS
   * custom properties (--door-x, --door-y, --door-w, --door-h, in px).
   */
  landing: HTMLElement | null;
}

/** The words on the bottle's tag and spelled in currants on the cake, in the site language. */
export interface FallLabels {
  drinkMe: string;
  eatMe: string;
}

/** One playing card of our deck (src/data/links.ts), with its link drawn as an SVG string. */
export interface FallCard {
  id: string;
  name: string;
  rank: string;
  /** Standalone SVG markup of the link's line art (currentColor strokes). */
  svg: string;
}

/** What the objects of the fall need from the app, gathered after first paint. */
export interface FallObjectsData {
  labels: FallLabels;
  cards: readonly FallCard[];
  /** The T-shirt word band 2's letters spell on this visit (src/data/tees.ts). */
  word: string;
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
  /**
   * Development only (?fall=0..1): freezes the entrance at that progress for
   * screenshots. null in normal browsing; production builds never pass it.
   */
  fall?: number | null;
  /**
   * The objects of the fall (step 12): called once the scene has drawn and the
   * browser is idle, so building them never delays the first paint.
   */
  objects?: () => Promise<FallObjectsData>;
  /** Development only (?word=): hold band 2's word assembled, for screenshots. */
  holdWord?: boolean;
  /** Development only (?land=0..1): freezes the landing at that progress while it is on screen. */
  land?: number | null;
  /** Called once, on the frame after the first draw (fades the canvas in). */
  onReady?: () => void;
  /**
   * Called when the browser drops the WebGL context (a phone backgrounding the
   * tab, a GPU reset). The engine has already stopped; dispose it and build a
   * new one (ChainStage does this, with a retry limit).
   */
  onContextLost?: () => void;
}

export interface ChainScene {
  /** Re-measure the stage and anchors and rebuild the path. */
  rebuild: () => void;
  setReducedMotion: (reduced: boolean) => void;
  /** The site language changed: redraw the bottle's tag and the cake's currants. */
  setLabels: (labels: FallLabels) => void;
  /** Stops everything and frees every GPU resource. Safe to call twice. */
  dispose: () => void;
}
