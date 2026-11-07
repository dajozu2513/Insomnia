import { AdditiveBlending, Color, Mesh, PlaneGeometry, ShaderMaterial } from 'three';

/** --accent-glow (rgba(196, 40, 45, 0.35)): light only, never a fill. */
const GLOW_COLOR = new Color(196 / 255, 40 / 255, 45 / 255);
/** Depth of the glow plane, far behind every link. */
const GLOW_Z = -14;

export interface Glow {
  mesh: Mesh;
  /** Opacity 0..1 from the night cycle (strongest at midnight). */
  setStrength: (strength: number) => void;
  /** Keeps the glow centred on the camera and sized to the view at its depth. */
  follow: (cameraY: number, halfWidth: number, viewHeight: number) => void;
  dispose: () => void;
}

/**
 * The midnight glow: a soft blood-red haze far behind the chain, a light in
 * the mist rather than a colour on the steel. A radial falloff in a tiny
 * shader; additive, so it only ever adds light to the dark behind the links.
 */
export function createGlow(): Glow {
  const geometry = new PlaneGeometry(1, 1);
  const material = new ShaderMaterial({
    uniforms: {
      uColor: { value: GLOW_COLOR },
      uStrength: { value: 0 },
    },
    vertexShader: /* glsl */ `
      varying vec2 vUv;
      void main() {
        vUv = uv;
        gl_Position = projectionMatrix * modelViewMatrix * vec4(position, 1.0);
      }
    `,
    fragmentShader: /* glsl */ `
      uniform vec3 uColor;
      uniform float uStrength;
      varying vec2 vUv;
      void main() {
        vec2 c = (vUv - 0.5) * vec2(1.0, 1.35);
        float falloff = smoothstep(0.5, 0.0, length(c));
        gl_FragColor = vec4(uColor * falloff * falloff * uStrength, 1.0);
      }
    `,
    transparent: true,
    depthWrite: false,
    fog: false,
    blending: AdditiveBlending,
  });
  const mesh = new Mesh(geometry, material);
  mesh.position.z = GLOW_Z;
  mesh.renderOrder = -2;
  mesh.frustumCulled = false;

  return {
    mesh,
    setStrength(strength) {
      const uniform = material.uniforms.uStrength;
      if (uniform) uniform.value = strength;
      mesh.visible = strength > 0.002;
    },
    follow(cameraY, halfWidth, viewHeight) {
      mesh.position.y = cameraY;
      mesh.scale.set(halfWidth * 2.4, viewHeight * 1.25, 1);
    },
    dispose() {
      geometry.dispose();
      material.dispose();
    },
  };
}
