import {
  Color,
  CustomBlending,
  Mesh,
  OneMinusSrcAlphaFactor,
  PlaneGeometry,
  ShaderMaterial,
  SrcAlphaFactor,
} from 'three';

import { DIST } from './constants';

/** --accent (#8f1d22) and --accent-glow (rgb 196 40 45): the intro's red. */
const ACCENT = new Color(0x8f / 255, 0x1d / 255, 0x22 / 255);
const ACCENT_GLOW = new Color(196 / 255, 40 / 255, 45 / 255);
/** Depth of the plane: behind every link, in front of the far floor. */
const MIST_Z = -8;
/** Overall strength at the top of the hero; subtler than the intro's mist. */
export const HERO_MIST_STRENGTH = 0.7;

export interface HeroMist {
  mesh: Mesh;
  /** 0..1 from the hero window's presence on screen (0 hides it). */
  setPresence: (presence: number) => void;
  /** Keeps the mist filling the view, centred on the camera. */
  follow: (cameraY: number, halfWidth: number, viewHeight: number) => void;
  dispose: () => void;
}

/**
 * The hero's red mist: the intro's blood-red haze carried into the 3D scene so
 * the curtain lifts into the same night. Low and towards the edges, subtler
 * than the intro, drawn after the floor and before the chain with neither depth
 * test nor depth writes: it lies over the fog, the floor and the background,
 * and every link is drawn on top of it, so the steel is never tinted.
 *
 * Same shape as the intro's mist (styles in IntroSplash.css): eased radial
 * falloffs in the bottom and the lower corners, the centre left clean.
 */
export function createHeroMist(): HeroMist {
  const geometry = new PlaneGeometry(1, 1);
  const material = new ShaderMaterial({
    uniforms: {
      uAccent: { value: ACCENT },
      uGlow: { value: ACCENT_GLOW },
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
      uniform vec3 uAccent;
      uniform vec3 uGlow;
      uniform float uStrength;
      varying vec2 vUv;

      // Eased radial falloff: 1 at the centre of the ellipse, 0 at its rim.
      float blob(vec2 uv, vec2 centre, vec2 radius) {
        float d = length((uv - centre) / radius);
        float t = clamp(1.0 - d, 0.0, 1.0);
        return t * t * (3.0 - 2.0 * t);
      }

      void main() {
        // uv: (0, 0) bottom-left of the view, (1, 1) top-right
        float bottom = blob(vUv, vec2(0.5, -0.12), vec2(0.62, 0.42));
        float left = blob(vUv, vec2(-0.04, 0.02), vec2(0.32, 0.5));
        float right = blob(vUv, vec2(1.04, 0.06), vec2(0.32, 0.5));
        vec3 colour = mix(uAccent, uGlow, clamp(bottom * 1.2, 0.0, 1.0));
        float alpha = clamp(bottom * 0.42 + left * 0.46 + right * 0.44, 0.0, 0.6) * uStrength;
        gl_FragColor = vec4(colour, alpha);
      }
    `,
    // Opaque pass, after the floor and before the chain; alpha kept by custom blending
    transparent: false,
    blending: CustomBlending,
    blendSrc: SrcAlphaFactor,
    blendDst: OneMinusSrcAlphaFactor,
    depthTest: false,
    depthWrite: false,
    fog: false,
  });
  const mesh = new Mesh(geometry, material);
  mesh.position.z = MIST_Z;
  mesh.renderOrder = -0.5;
  mesh.frustumCulled = false;
  mesh.visible = false;

  return {
    mesh,
    setPresence(presence) {
      const strength = HERO_MIST_STRENGTH * presence;
      const uniform = material.uniforms.uStrength;
      if (uniform) uniform.value = strength;
      mesh.visible = strength > 0.002;
    },
    follow(cameraY, halfWidth, viewHeight) {
      // Sized to the view at the plane's depth
      const scale = (DIST - MIST_Z) / DIST;
      mesh.position.y = cameraY;
      mesh.scale.set(halfWidth * 2 * scale * 1.02, viewHeight * scale * 1.02, 1);
    },
    dispose() {
      geometry.dispose();
      material.dispose();
    },
  };
}
