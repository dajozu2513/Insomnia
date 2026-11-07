import { Curve, MeshStandardMaterial, TubeGeometry, Vector3 } from 'three';

import {
  LINK_RADIAL_SEGMENTS,
  LINK_RADIUS,
  LINK_STRAIGHT,
  LINK_TUBULAR_SEGMENTS,
  STEEL_COLOR,
  STEEL_ENV_MAP_INTENSITY,
  STEEL_METALNESS,
  STEEL_ROUGHNESS,
  WIRE,
} from './constants';

/** Centre line of one link: two straights joined by half circles, in the xy plane. */
export class StadiumCurve extends Curve<Vector3> {
  // Curve's own constructor is protected in @types/three; this one is public.
  public constructor() {
    super();
  }

  override getPoint(t: number, target = new Vector3()): Vector3 {
    const L = LINK_STRAIGHT;
    const r = LINK_RADIUS;
    const arc = Math.PI * r;
    let s = t * (2 * L + 2 * arc);
    if (s < L) return target.set(-L / 2 + s, r, 0);
    s -= L;
    if (s < arc) {
      const a = Math.PI / 2 - s / r;
      return target.set(L / 2 + r * Math.cos(a), r * Math.sin(a), 0);
    }
    s -= arc;
    if (s < L) return target.set(L / 2 - s, -r, 0);
    s -= L;
    const a = -Math.PI / 2 - s / r;
    return target.set(-L / 2 + r * Math.cos(a), r * Math.sin(a), 0);
  }
}

/** One link, shared by every instance of the chain. */
export function createLinkGeometry(): TubeGeometry {
  return new TubeGeometry(
    new StadiumCurve(),
    LINK_TUBULAR_SEGMENTS,
    WIRE,
    LINK_RADIAL_SEGMENTS,
    true,
  );
}

export function createSteelMaterial(): MeshStandardMaterial {
  return new MeshStandardMaterial({
    color: STEEL_COLOR,
    metalness: STEEL_METALNESS,
    roughness: STEEL_ROUGHNESS,
    envMapIntensity: STEEL_ENV_MAP_INTENSITY,
  });
}
