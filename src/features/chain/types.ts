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
  /**
   * The T-shirt section (step 14): a window onto the shaft (section), with the
   * floating rack centred on its stage. Null while the section shows its grid.
   */
  rack: { section: HTMLElement; stage: HTMLElement } | null;
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

/** One tee of the rack: where its mockup sits in the atlas (uv: left, bottom, width, height). */
export interface RackTee {
  id: string;
  word: string;
  colour: 'black' | 'white';
  u: number;
  v: number;
  w: number;
  h: number;
}

/**
 * The ten tees of the rack (step 14), drawn from the step 6 mockups and prints
 * (front, the meaning in the site language) into one canvas.
 */
export interface TeeAtlas {
  canvas: HTMLCanvasElement;
  tees: readonly RackTee[];
}

/** What the objects of the fall need from the app, gathered after first paint. */
export interface FallObjectsData {
  labels: FallLabels;
  cards: readonly FallCard[];
  /** The T-shirt word band 2's letters spell on this visit (src/data/tees.ts). */
  word: string;
  /** The rack's tees (null: no rack, the T-shirt section shows its grid). */
  tees: TeeAtlas | null;
}

/** The rack, driven from the DOM (features/rack): turning it, picking a tee, where a tee shows. */
export interface RackController {
  /** Turns the rack by a horizontal drag of `dx` CSS pixels. */
  drag: (dx: number) => void;
  /** Ends a drag at `velocity` px/s: it coasts and eases to rest with a tee facing the visitor. */
  release: (velocity: number) => void;
  /** Turns to the next (1) or previous (-1) tee. */
  step: (direction: 1 | -1) => void;
  /** Turns to tee `index` (the shorter way round). */
  goTo: (index: number) => void;
  /** The tee under a point of the viewport, or null. */
  pick: (clientX: number, clientY: number) => number | null;
  /** Where tee `index` shows on screen (viewport pixels), or null when it is not drawn. */
  rect: (index: number) => { left: number; top: number; width: number; height: number } | null;
  /** True once the rack has eased to rest with a tee facing the visitor. */
  atRest: () => boolean;
  /** Pauses the slow turning of its own (pointer over the rack, focus inside it). */
  hold: (on: boolean) => void;
}

/** How the engine tells the DOM about the rack. */
export interface RackHooks {
  /** The rack is built and can be driven. */
  onReady: (controller: RackController) => void;
  /** The tee facing the visitor changed. */
  onFacing: (index: number) => void;
  /** The rack could not be built (or the scene failed): the section shows its grid. */
  onFailed: () => void;
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
  /** The rack (step 14): how the engine reports to the T-shirt section. */
  rack?: RackHooks;
  /** Development only (?rack=<tee id>): the rack held still, facing this tee. */
  rackHold?: number | null;
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
  /** A product dialog covers the page: stop the loop until it closes (the last frame stays). */
  setPaused: (paused: boolean) => void;
  /** The site language changed: redraw the bottle's tag and the cake's currants. */
  setLabels: (labels: FallLabels) => void;
  /** The site language changed: new prints for the rack's tees (the old ones are disposed). */
  setTeeAtlas: (atlas: TeeAtlas) => void;
  /** Stops everything and frees every GPU resource. Safe to call twice. */
  dispose: () => void;
}
