import { AdditiveBlending, Mesh, PlaneGeometry, ShaderMaterial } from 'three';

import type { SceneAtmosphere } from '../../atmosphere/variants';
import { rawColor } from './rawColor';

/** Depth of the glow plane, far behind every link. */
const GLOW_Z = -14;

export interface Glow {
  mesh: Mesh;
  /** The night cycle's glow, 0..1 (strongest at midnight); the variant scales it. */
  setStrength: (nightGlow: number) => void;
  /** Keeps the glow centred on the camera and sized to the view at its depth. */
  follow: (cameraY: number, halfWidth: number, viewHeight: number) => void;
  dispose: () => void;
}

/**
 * The glow far behind the chain: a light in the mist rather than a colour on
 * the steel. A radial falloff in a tiny shader; additive, so it only ever adds
 * light to the dark behind the links. The current look is the blood-red
 * midnight glow; the dreamlike variants keep a little of it at every hour, in
 * their own colour, lifted towards the veils.
 */
export function createGlow(glow: SceneAtmosphere['glow']): Glow {
  const geometry = new PlaneGeometry(1, 1);
  const material = new ShaderMaterial({
    uniforms: {
      uColor: { value: rawColor(glow.colour) },
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
    setStrength(nightGlow) {
      const strength = glow.base + nightGlow * glow.gain;
      const uniform = material.uniforms.uStrength;
      if (uniform) uniform.value = strength;
      mesh.visible = strength > 0.002;
    },
    follow(cameraY, halfWidth, viewHeight) {
      const height = viewHeight * 1.25;
      mesh.position.y = cameraY + glow.lift * height;
      mesh.scale.set(halfWidth * 2.4, height, 1);
    },
    dispose() {
      geometry.dispose();
      material.dispose();
    },
  };
}
