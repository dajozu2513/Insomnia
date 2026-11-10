import { CatmullRomCurve3, MathUtils, Vector3 } from 'three';

import { CHAIN_Z, DIST, DRAPE_STYLE, FRAME_SAMPLES } from './constants';

/** A band as the path needs it: its top in document pixels and its height. */
export interface BandBox {
  top: number;
  height: number;
}

/** The page camera's view at the chain's plane (z = 0). */
export interface ViewMetrics {
  /** World units per CSS pixel at z = 0. */
  pxToWorld: number;
  /** World height and half-width of the view at z = 0. */
  viewHeight: number;
  halfWidth: number;
  /** 0 on tall (portrait) screens, 1 on wide ones. */
  wide: number;
}

export interface ChainPath {
  curve: CatmullRomCurve3;
  length: number;
  frames: { tangents: Vector3[]; normals: Vector3[]; binormals: Vector3[] };
}

export function viewMetrics(width: number, height: number, tanHalfFov: number): ViewMetrics {
  const aspect = width / height;
  const viewHeight = 2 * DIST * tanHalfFov;
  return {
    pxToWorld: viewHeight / height,
    viewHeight,
    halfWidth: (viewHeight * aspect) / 2,
    wide: MathUtils.clamp((aspect - 0.5) / 0.8, 0, 1),
  };
}

/**
 * The chain's path across the bands that carry it (band 1 for now), placed so
 * each band's drape sits where the page camera will be when that band is
 * centred on screen (`cameraYAt` maps a page scroll to the camera's height).
 * Null when no band carries the chain. The chain enters from off screen, hangs
 * across each band like a real chain (a gentle catenary centred in the band,
 * entering alternately from the left and the right) and leaves off screen,
 * rising away above the last band.
 */
export function buildChainPath(
  view: ViewMetrics,
  viewportHeight: number,
  bands: readonly BandBox[],
  cameraYAt: (scroll: number) => number,
): ChainPath | null {
  if (bands.length === 0) return null;
  const { viewHeight: V, halfWidth: W, wide } = view;
  const z = CHAIN_Z;
  const crossings =
    DRAPE_STYLE === 'centred'
      ? ([
          { side: -1, edge: 0.2, mid: -0.1 },
          { side: 1, edge: 0.2, mid: -0.1 },
        ] as const)
      : ([
          {
            side: -1,
            edge: MathUtils.lerp(-0.2, 0.1, wide),
            mid: MathUtils.lerp(-0.42, -0.34, wide),
          },
          { side: 1, edge: 0.5, mid: 0.25 },
        ] as const);

  const pts: Vector3[] = [];
  bands.forEach((band, i) => {
    const { side, edge, mid } = crossings[i % crossings.length] ?? crossings[0];
    const y = cameraYAt(band.top + band.height / 2 - viewportHeight / 2);
    const s = (DIST - z) / DIST;
    const b = band.height * view.pxToWorld * s;
    const halfW = W * 1.1 * s;
    const sag = (t: number) => y + b * (mid + (edge - mid) * t * t);
    if (i === 0) pts.push(new Vector3(side * W * 2.6, y + V * 1.4, z - 8)); // from far above, off screen
    pts.push(new Vector3(side * W * 1.7, y + V * 0.6, z - 4));
    [1, 0.5, 0, -0.5, -1].forEach((t) => pts.push(new Vector3(side * t * halfW, sag(t), z)));
    if (i < bands.length - 1) {
      pts.push(new Vector3(-side * W * 1.7, y - V * 0.6, z - 4)); // down to the next band
    } else {
      // The last drape rises away on the other side, off screen, mirroring how it
      // came in: the chain hangs between two points above, and no length of it
      // trails down into the windows below
      pts.push(new Vector3(-side * W * 1.7, y + V * 0.6, z - 4));
      pts.push(new Vector3(-side * W * 2.6, y + V * 1.4, z - 8));
    }
  });

  const curve = new CatmullRomCurve3(pts, false, 'centripetal');
  return {
    curve,
    length: curve.getLength(),
    frames: curve.computeFrenetFrames(FRAME_SAMPLES, false),
  };
}
