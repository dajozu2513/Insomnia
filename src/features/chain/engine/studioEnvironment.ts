import {
  BackSide,
  BoxGeometry,
  Color,
  DoubleSide,
  Mesh,
  MeshBasicMaterial,
  PlaneGeometry,
  Scene,
} from 'three';

import { STUDIO_PANELS, STUDIO_ROOM_COLOR, STUDIO_ROOM_SIZE } from './constants';

export interface StudioEnvironment {
  scene: Scene;
  /** Frees the studio's geometries and materials once it has been baked. */
  dispose: () => void;
}

/**
 * Polished steel looks silver, not white, because it mirrors a mostly dark room
 * with a few hard light sources: grey body, crisp bright streaks along the
 * edges. This builds that jewellery-photo studio in code (no HDR download); the
 * caller bakes it into an environment map with PMREMGenerator. Panel colours
 * above 1 act as bright HDR lights.
 */
export function createStudioEnvironment(): StudioEnvironment {
  const scene = new Scene();
  const geometries: (BoxGeometry | PlaneGeometry)[] = [];
  const materials: MeshBasicMaterial[] = [];

  const roomGeometry = new BoxGeometry(STUDIO_ROOM_SIZE, STUDIO_ROOM_SIZE, STUDIO_ROOM_SIZE);
  const roomMaterial = new MeshBasicMaterial({ color: STUDIO_ROOM_COLOR, side: BackSide });
  geometries.push(roomGeometry);
  materials.push(roomMaterial);
  scene.add(new Mesh(roomGeometry, roomMaterial));

  for (const [w, h, x, y, z, intensity] of STUDIO_PANELS) {
    const geometry = new PlaneGeometry(w, h);
    const material = new MeshBasicMaterial({
      color: new Color(intensity, intensity, intensity),
      side: DoubleSide,
    });
    geometries.push(geometry);
    materials.push(material);
    const panel = new Mesh(geometry, material);
    panel.position.set(x, y, z);
    panel.lookAt(0, 0, 0);
    scene.add(panel);
  }

  return {
    scene,
    dispose: () => {
      geometries.forEach((g) => {
        g.dispose();
      });
      materials.forEach((m) => {
        m.dispose();
      });
    },
  };
}
