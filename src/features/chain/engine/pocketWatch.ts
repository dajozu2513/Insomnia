import {
  AdditiveBlending,
  BoxGeometry,
  CanvasTexture,
  CircleGeometry,
  CylinderGeometry,
  Euler,
  Group,
  type Material,
  Matrix4,
  Mesh,
  MeshStandardMaterial,
  ShaderMaterial,
  SphereGeometry,
  SRGBColorSpace,
  TorusGeometry,
  type BufferGeometry,
} from 'three';
import { mergeGeometries } from 'three/addons/utils/BufferGeometryUtils.js';

/** Seconds between two glints across the glass. */
const GLINT_PERIOD = 5.5;

export interface WatchOptions {
  /** How far the lid stands open, in radians; null for no lid (a bare clock face). */
  lid: number | null;
  /** A short length of chain trailing from the bow. */
  chain: boolean;
  /** Crown and bow at 12 o'clock. */
  crown: boolean;
  /** Seconds the glint is offset by, so floating watches do not glint together. */
  glintOffset?: number;
}

/** The watch at the edge of the hole: lid open past upright, crown, bow and a short chain. */
export const EDGE_WATCH: WatchOptions = { lid: 1.95, chain: true, crown: true };

export interface PocketWatch3D {
  group: Group;
  /** Advances the glint (0 with reduced motion: the glass stays still). */
  tick: (dt: number) => void;
  /** Sets the hands to the night's hour (progress 0..1), in step with the header watch. */
  setNight: (progress: number) => void;
  /**
   * The watch's steel meshes (case, rim, crown, bow, lid and chain, merged), for
   * the steel measurement; the dial, the hands and the glass are left out.
   */
  meshes: Mesh[];
  dispose: () => void;
}

/** The dial: bone with twelve ticks, longer at the quarters; the hands are meshes. */
function dialTexture(): CanvasTexture {
  const size = 256;
  const canvas = document.createElement('canvas');
  canvas.width = canvas.height = size;
  const ctx = canvas.getContext('2d');
  if (ctx) {
    const c = size / 2;
    ctx.fillStyle = '#e8e1d3';
    ctx.fillRect(0, 0, size, size);
    ctx.strokeStyle = '#141215';
    ctx.lineCap = 'round';
    for (let i = 0; i < 12; i++) {
      const a = (i / 12) * Math.PI * 2;
      const quarter = i % 3 === 0;
      const r1 = c * 0.9;
      const r0 = c * (quarter ? 0.72 : 0.8);
      ctx.lineWidth = quarter ? 7 : 4;
      ctx.beginPath();
      ctx.moveTo(c + Math.sin(a) * r0, c - Math.cos(a) * r0);
      ctx.lineTo(c + Math.sin(a) * r1, c - Math.cos(a) * r1);
      ctx.stroke();
    }
  }
  const texture = new CanvasTexture(canvas);
  texture.colorSpace = SRGBColorSpace;
  return texture;
}

/** A geometry with a transform baked in (for merging the steel into one mesh). */
function placed(geometry: BufferGeometry, matrix: Matrix4): BufferGeometry {
  geometry.applyMatrix4(matrix);
  return geometry;
}

/**
 * A pocket watch in the site's steel (neutral silver, measured), with a bone
 * dial under a glass whose soft glint crosses it every few seconds. Its hands
 * show the night's hour, as the header watch does (hour hand 180 + 360p
 * degrees, minute hand 4320p, clockwise from 12; see
 * features/clock/watchGeometry.ts). One lies on a root at the edge of the
 * hole, a hint of who went down first, without showing anyone; more float down
 * the shaft, and bare clock faces (no lid, crown or chain) with them.
 * Local units: the case is 0.6 across, the dial faces +y, 12 o'clock is -z.
 */
export function createPocketWatch(
  steel: Material,
  linkGeometry: BufferGeometry,
  options: WatchOptions = EDGE_WATCH,
): PocketWatch3D {
  const group = new Group();
  const m = new Matrix4();
  const r = new Matrix4();
  const e = new Euler();

  // ── STEEL ── case, rim, crown, bow, lid and chain merged into one mesh
  const parts: BufferGeometry[] = [
    new CylinderGeometry(0.3, 0.29, 0.07, 48),
    placed(new TorusGeometry(0.295, 0.028, 12, 48), m.makeRotationX(Math.PI / 2)),
  ];
  if (options.crown) {
    parts.push(
      placed(
        new CylinderGeometry(0.035, 0.035, 0.07, 16),
        m.makeRotationX(Math.PI / 2).setPosition(0, 0, -0.335),
      ),
      placed(new TorusGeometry(0.06, 0.012, 8, 24), m.makeTranslation(0, 0, -0.42)),
    );
  }
  if (options.lid !== null) {
    // Hinged at 9 o'clock (-x): the disc is turned about the hinge
    const lid = new CylinderGeometry(0.295, 0.3, 0.02, 48);
    lid.translate(0.3, 0, 0);
    parts.push(placed(lid, m.makeRotationZ(options.lid).setPosition(-0.3, 0.05, 0)));
  }
  if (options.chain) {
    for (let i = 0; i < 7; i++) {
      const t = i / 6;
      // Every other link turned a quarter, so neighbours interlock
      r.makeRotationFromEuler(
        e.set(i % 2 ? Math.PI / 2 : 0, Math.PI / 2 + Math.sin(t * 2.4) * 0.4, 0),
      );
      m.makeScale(0.07, 0.07, 0.07)
        .premultiply(r)
        .setPosition(-0.08 * Math.sin(t * 2.4), -0.01, -0.5 - i * 0.075);
      parts.push(placed(linkGeometry.clone(), m));
    }
  }
  const steelGeometry = mergeGeometries(parts);
  parts.forEach((g) => {
    g.dispose();
  });
  const steelMesh = new Mesh(steelGeometry, steel);
  group.add(steelMesh);

  // ── DIAL ── aged bone, darkened so it never glares in the dim light
  const dialMap = dialTexture();
  const dialMaterial = new MeshStandardMaterial({
    map: dialMap,
    color: 0x7a766e,
    roughness: 0.7,
    metalness: 0,
    envMapIntensity: 0.35,
  });
  const dialGeometry = new CircleGeometry(0.265, 48);
  const dial = new Mesh(dialGeometry, dialMaterial);
  dial.rotation.x = -Math.PI / 2;
  dial.position.y = 0.037;
  group.add(dial);

  // ── HANDS ── slender, dark, turning about the dial's centre (pointing to 12 at rest)
  const handMaterial = new MeshStandardMaterial({ color: 0x141215, roughness: 0.5 });
  const hourGeometry = new BoxGeometry(0.022, 0.006, 0.15).translate(0, 0, -0.06);
  const minuteGeometry = new BoxGeometry(0.014, 0.006, 0.22).translate(0, 0, -0.095);
  const hour = new Mesh(hourGeometry, handMaterial);
  const minute = new Mesh(minuteGeometry, handMaterial);
  hour.position.y = 0.041;
  minute.position.y = 0.045;
  group.add(hour, minute);

  // ── GLASS ── a shallow cap; the glint is additive light, never a fill
  const glassMaterial = new ShaderMaterial({
    uniforms: { uTime: { value: options.glintOffset ?? 0 } },
    vertexShader: /* glsl */ `
      varying vec2 vXZ;
      void main() {
        vXZ = position.xz / 0.27;
        gl_Position = projectionMatrix * modelViewMatrix * vec4(position, 1.0);
      }
    `,
    fragmentShader: /* glsl */ `
      uniform float uTime;
      varying vec2 vXZ;
      void main() {
        // A soft diagonal glint sweeping across, every few seconds; faint sheen otherwise
        float phase = fract(uTime / ${GLINT_PERIOD.toFixed(1)}) * 3.0 - 1.0;
        float d = (vXZ.x + vXZ.y) * 0.5 - phase;
        float glint = exp(-d * d * 60.0) * 0.7;
        float sheen = 0.05;
        gl_FragColor = vec4(vec3(glint + sheen), 1.0);
      }
    `,
    transparent: true,
    blending: AdditiveBlending,
    depthWrite: false,
  });
  const glassGeometry = new SphereGeometry(0.62, 32, 8, 0, Math.PI * 2, 0, 0.45);
  const glass = new Mesh(glassGeometry, glassMaterial);
  glass.position.y = 0.037 - 0.62 * Math.cos(0.45) + 0.012;
  group.add(glass);

  let time = options.glintOffset ?? 0;
  return {
    group,
    meshes: [steelMesh],
    tick(dt) {
      time += dt;
      const uniform = glassMaterial.uniforms.uTime;
      if (uniform) uniform.value = time;
    },
    setNight(progress) {
      // Clockwise seen from above (+y) is a negative turn about y
      hour.rotation.y = -((180 + 360 * progress) * Math.PI) / 180;
      minute.rotation.y = -(360 * 12 * progress * Math.PI) / 180;
    },
    dispose() {
      steelGeometry.dispose();
      dialGeometry.dispose();
      hourGeometry.dispose();
      minuteGeometry.dispose();
      glassGeometry.dispose();
      dialMap.dispose();
      dialMaterial.dispose();
      handMaterial.dispose();
      glassMaterial.dispose();
    },
  };
}
