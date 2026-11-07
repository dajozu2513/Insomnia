import { CatmullRomCurve3, MathUtils, Vector3 } from 'three';

import { DIST, DRAPE_STYLE, FRAME_SAMPLES } from './constants';

/** A band as the path needs it: its top in document pixels and its height. */
export interface BandBox {
  top: number;
  height: number;
}

export interface PathLayout {
  /** Size of the fixed stage, in CSS pixels. */
  viewportWidth: number;
  viewportHeight: number;
  /** tan(fov / 2) of the camera. */
  tanHalfFov: number;
  /** Camera parallax factor (PARALLAX, or 1 with reduced motion). */
  parallax: number;
  /** The bands in document order. */
  bands: readonly BandBox[];
}

export interface ChainPath {
  curve: CatmullRomCurve3;
  length: number;
  frames: { tangents: Vector3[]; normals: Vector3[]; binormals: Vector3[] };
  /** World units per CSS pixel at z = 0. */
  pxToWorld: number;
  /** World height and half-width of the view at z = 0. */
  viewHeight: number;
  halfWidth: number;
  /** 0 on tall (portrait) screens, 1 on wide ones. */
  wide: number;
}

/** Camera height (world y) when the page is scrolled to `scroll` CSS pixels. */
export function cameraYFor(scroll: number, pxToWorld: number, parallax: number): number {
  return -scroll * pxToWorld * parallax;
}

/**
 * Builds the chain's path from the live layout, so each band's stretch of chain
 * sits where the camera will be when that band is centred on screen.
 */
export function buildPath(layout: PathLayout): ChainPath {
  const { viewportWidth: vw, viewportHeight: vh, tanHalfFov, parallax, bands } = layout;
  const aspect = vw / vh;
  const V = 2 * DIST * tanHalfFov; // world height of the viewport at z = 0
  const W = (V * aspect) / 2; // world half-width at z = 0
  const pxToWorld = V / vh;

  // Hero: an open necklace around the title. Laid back on wide screens, closer to
  // face-on on tall ones so it frames the title instead of crossing it.
  const wide = MathUtils.clamp((aspect - 0.5) / 0.8, 0, 1);
  const tilt = MathUtils.lerp(-0.45, -1.0, wide);
  const R = MathUtils.clamp(W * 0.85, V * 0.28, V * 0.6);
  const ring = (deg: number) => {
    const a = MathUtils.degToRad(deg);
    return new Vector3(
      R * Math.cos(a),
      R * Math.sin(a) * Math.cos(tilt),
      R * Math.sin(a) * Math.sin(tilt),
    );
  };

  // The chain joins the ring at its back right (60°) already travelling the way the
  // ring runs (counter-clockwise: over the top, down the left, across the front), so
  // there is no hairpin. Straight links can't follow a tight bend; they overlap and
  // flicker. Keep every turn in the path wide.
  const entry = ring(60);
  const pts = [new Vector3(entry.x + R * 1.6, entry.y + R * 1.2, entry.z)]; // off the top right
  for (let deg = 60; deg <= 300; deg += 40) pts.push(ring(deg));
  pts.push(new Vector3(R * 0.95, -V * 0.72, R * 0.35)); // drops out under the hero

  // Bands: the chain hangs across each one like a real chain, clear of the phrase in
  // the middle. It passes at the same depth as the front of the hero necklace, so the
  // links read the same size in all three windows. (side) is where it enters,
  // (edge)/(mid) its height at the band's sides and centre as a fraction of the band.
  // Offsets are scaled by the depth so the drape fills the band on screen.
  // On narrow screens the first drape sags deeper so it clears a full-width phrase.
  const z = -R * Math.sin(tilt); // depth of the necklace's nearest point
  const crossings =
    DRAPE_STYLE === 'centred'
      ? ([
          // Text-free bands: both drapes are gentle catenaries centred in the band
          // (edges 0.2 above the centre line, the middle 0.1 below, so the curve
          // averages out on the band's centre line).
          { side: -1, edge: 0.2, mid: -0.1 },
          { side: 1, edge: 0.2, mid: -0.1 },
        ] as const)
      : ([
          {
            side: -1,
            edge: MathUtils.lerp(-0.2, 0.1, wide),
            mid: MathUtils.lerp(-0.42, -0.34, wide),
          }, // sags low
          { side: 1, edge: 0.5, mid: 0.25 }, // hangs high
        ] as const);
  bands.forEach((band, i) => {
    const { side, edge, mid } = crossings[i % crossings.length] ?? crossings[0];
    const y = cameraYFor(band.top + band.height / 2 - vh / 2, pxToWorld, parallax);
    const s = (DIST - z) / DIST;
    const b = band.height * pxToWorld * s;
    const halfW = W * 1.1 * s;
    const sag = (t: number) => y + b * (mid + (edge - mid) * t * t); // parabola: mid at t = 0, edge at |t| = 1
    pts.push(new Vector3(side * W * 1.7, y + V * 0.6, z - 4));
    [1, 0.5, 0, -0.5, -1].forEach((t) => pts.push(new Vector3(side * t * halfW, sag(t), z)));
    pts.push(new Vector3(-side * W * 1.7, y - V * 0.6, z - 4));
  });

  const last = pts[pts.length - 1] ?? new Vector3();
  pts.push(new Vector3(last.x * 0.5, last.y - V, -6)); // trails off below

  const curve = new CatmullRomCurve3(pts, false, 'centripetal');
  return {
    curve,
    length: curve.getLength(),
    frames: curve.computeFrenetFrames(FRAME_SAMPLES, false),
    pxToWorld,
    viewHeight: V,
    halfWidth: W,
    wide,
  };
}
