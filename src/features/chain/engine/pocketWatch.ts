import {
  AdditiveBlending,
  CanvasTexture,
  CircleGeometry,
  CylinderGeometry,
  Group,
  type Material,
  Mesh,
  MeshStandardMaterial,
  ShaderMaterial,
  SphereGeometry,
  SRGBColorSpace,
  TorusGeometry,
  type BufferGeometry,
} from 'three';

/** Seconds between two glints across the glass. */
const GLINT_PERIOD = 5.5;

export interface PocketWatch3D {
  group: Group;
  /** Advances the glint (0 with reduced motion: the glass stays still). */
  tick: (dt: number) => void;
  /**
   * The watch's steel meshes (case, rim, crown, bow, lid and chain), for the
   * steel measurement; the dial and the glass are left out.
   */
  meshes: Mesh[];
  dispose: () => void;
}

/** The dial: bone, twelve ticks, the hands at 6:00 (the start of the night), drawn on a canvas. */
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
    // 6:00: the hour hand down, the minute hand up
    ctx.lineWidth = 6;
    ctx.beginPath();
    ctx.moveTo(c, c);
    ctx.lineTo(c, c + c * 0.5);
    ctx.stroke();
    ctx.lineWidth = 4;
    ctx.beginPath();
    ctx.moveTo(c, c);
    ctx.lineTo(c, c - c * 0.74);
    ctx.stroke();
    ctx.fillStyle = '#141215';
    ctx.beginPath();
    ctx.arc(c, c, 9, 0, Math.PI * 2);
    ctx.fill();
  }
  const texture = new CanvasTexture(canvas);
  texture.colorSpace = SRGBColorSpace;
  return texture;
}

/**
 * A small pocket watch lying on a root at the edge of the hole: a hint of who
 * went down first, without showing anyone. Case, crown and bow, an open lid
 * and a short length of chain in the site's steel (neutral silver, measured),
 * a bone dial at 6:00 under a glass whose soft glint crosses it every few
 * seconds. Local units: the case is 0.6 across.
 */
export function createPocketWatch(steel: Material, linkGeometry: BufferGeometry): PocketWatch3D {
  const group = new Group();
  const geometries: BufferGeometry[] = [];
  const meshes: Mesh[] = [];
  const add = (geometry: BufferGeometry, material: Material): Mesh => {
    geometries.push(geometry);
    const mesh = new Mesh(geometry, material);
    if (material === steel) meshes.push(mesh);
    group.add(mesh);
    return mesh;
  };

  // Case: a shallow drum with a rounded rim
  add(new CylinderGeometry(0.3, 0.29, 0.07, 48), steel).position.y = 0;
  add(new TorusGeometry(0.295, 0.028, 12, 48), steel).rotation.x = Math.PI / 2;
  // Dial and glass
  const dialMap = dialTexture();
  // An aged bone dial in the dim light of the edge: darkened, so it never glares
  const dialMaterial = new MeshStandardMaterial({
    map: dialMap,
    color: 0x7a766e,
    roughness: 0.7,
    metalness: 0,
    envMapIntensity: 0.35,
  });
  const dial = add(new CircleGeometry(0.265, 48), dialMaterial);
  dial.rotation.x = -Math.PI / 2;
  dial.position.y = 0.037;
  const glassMaterial = new ShaderMaterial({
    uniforms: { uTime: { value: 0 } },
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
  const glass = add(new SphereGeometry(0.62, 32, 8, 0, Math.PI * 2, 0, 0.45), glassMaterial);
  glass.position.y = 0.037 - 0.62 * Math.cos(0.45) + 0.012;
  // Crown and bow at 12 o'clock (-z)
  const crown = add(new CylinderGeometry(0.035, 0.035, 0.07, 16), steel);
  crown.rotation.x = Math.PI / 2;
  crown.position.set(0, 0, -0.335);
  const bow = add(new TorusGeometry(0.06, 0.012, 8, 24), steel);
  bow.position.set(0, 0, -0.42);
  // Lid, hinged at 9 o'clock (-x), standing open past upright
  const lid = new Group();
  const lidDisc = new Mesh(new CylinderGeometry(0.295, 0.3, 0.02, 48), steel);
  geometries.push(lidDisc.geometry);
  meshes.push(lidDisc);
  lidDisc.position.set(0.3, 0, 0);
  lid.add(lidDisc);
  lid.position.set(-0.3, 0.05, 0);
  lid.rotation.z = 1.95;
  group.add(lid);
  // A short length of chain trailing from the bow
  for (let i = 0; i < 7; i++) {
    const link = new Mesh(linkGeometry, steel);
    meshes.push(link);
    link.scale.setScalar(0.07);
    const t = i / 6;
    link.position.set(-0.08 * Math.sin(t * 2.4), -0.01, -0.5 - i * 0.075);
    link.rotation.set(i % 2 ? Math.PI / 2 : 0, Math.PI / 2 + Math.sin(t * 2.4) * 0.4, 0);
    group.add(link);
  }

  let time = 0;
  return {
    group,
    meshes,
    tick(dt) {
      time += dt;
      const uniform = glassMaterial.uniforms.uTime;
      if (uniform) uniform.value = time;
    },
    dispose() {
      geometries.forEach((g) => {
        g.dispose();
      });
      dialMap.dispose();
      dialMaterial.dispose();
      glassMaterial.dispose();
    },
  };
}
