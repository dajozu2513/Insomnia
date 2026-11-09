import { CustomBlending, Mesh, OneFactor, PlaneGeometry, ShaderMaterial } from 'three';

import { DIST, MIST_COLOUR, MIST_LIGHT, MIST_STRENGTH } from './constants';
import { rawColor } from './rawColor';

/** Depth of the plane: behind every link, in front of the far floor. */
const MIST_Z = -8;

export interface HeroMist {
  mesh: Mesh;
  /** 0..1 from the hero window's presence on screen (0 hides it). */
  setPresence: (presence: number) => void;
  /** Keeps the mist filling the view, centred on the camera. */
  follow: (cameraY: number, halfWidth: number, viewHeight: number) => void;
  /** Advances the veils' slow drift (0 with reduced motion: they stay still). */
  tick: (dt: number) => void;
  dispose: () => void;
}

const VERTEX = /* glsl */ `
  varying vec2 vUv;
  void main() {
    vUv = uv;
    gl_Position = projectionMatrix * modelViewMatrix * vec4(position, 1.0);
  }
`;

/**
 * The rose veils: three soft veils high in the frame, waving very
 * gently, broken into long thin wisps by a little value noise, with a few wide
 * pools of light inside them (the glow). Added as light, never laid over as a
 * colour. The drift is time-based and very slow; it stops with reduced motion.
 */
const VEILS_FRAGMENT = /* glsl */ `
  uniform vec3 uColour;
  uniform vec3 uLight;
  uniform float uStrength;
  uniform float uTime;
  varying vec2 vUv;
  float hash(vec2 p) {
    return fract(sin(dot(p, vec2(127.1, 311.7))) * 43758.5453);
  }
  float noise(vec2 p) {
    vec2 i = floor(p);
    vec2 f = fract(p);
    vec2 u = f * f * (3.0 - 2.0 * f);
    return mix(mix(hash(i), hash(i + vec2(1.0, 0.0)), u.x),
               mix(hash(i + vec2(0.0, 1.0)), hash(i + vec2(1.0, 1.0)), u.x), u.y);
  }
  // Three octaves, stretched along x so the shapes are long, thin wisps
  float wisps(vec2 p) {
    float v = 0.0;
    float a = 0.5;
    for (int i = 0; i < 3; i++) {
      v += a * noise(p);
      p = p * 2.07 + vec2(3.1, 1.7);
      a *= 0.5;
    }
    return v / 0.875;
  }
  float band(float y, float centre, float thickness) {
    float d = (y - centre) / thickness;
    return exp(-d * d);
  }
  // A wide, soft pool of light (Gaussian): the glow in the brightest mist
  float pool(vec2 uv, vec2 centre, vec2 radius) {
    vec2 d = (uv - centre) / radius;
    return exp(-dot(d, d));
  }
  void main() {
    vec2 uv = vUv;
    float t = uTime;
    float w = wisps(vec2(uv.x * 2.4 + t * 0.012, uv.y * 7.5 - t * 0.005));
    float veils =
      band(uv.y, 0.63 + 0.03 * sin(uv.x * 2.6 + t * 0.03), 0.075) * 0.6 +
      band(uv.y, 0.77 + 0.025 * sin(uv.x * 3.3 - t * 0.025 + 2.0), 0.06) * 0.5 +
      band(uv.y, 0.9 + 0.02 * sin(uv.x * 2.9 + t * 0.02 + 4.0), 0.06) * 0.4;
    float density = veils * smoothstep(0.32, 0.82, w);
    // Softer towards the sides of the frame
    density *= smoothstep(0.0, 0.18, uv.x) * (1.0 - smoothstep(0.82, 1.0, uv.x));
    float light =
      pool(uv, vec2(0.24, 0.66), vec2(0.2, 0.08)) +
      pool(uv, vec2(0.76, 0.78), vec2(0.2, 0.07)) * 0.85 +
      pool(uv, vec2(0.5, 0.9), vec2(0.17, 0.06)) * 0.7;
    vec3 colour = uColour * density + uLight * light * (0.25 + 0.75 * density) * 0.45;
    gl_FragColor = vec4(colour * uStrength, 1.0);
  }
`;

/**
 * The hero's haze, drawn after the floor and before the chain with neither
 * depth test nor depth writes: it lies over the fog, the floor and the
 * background, and every link is drawn on top of it, so the steel is never
 * tinted. The intro's rose mist gathers low; inside the scene the light rises
 * into high veils, so the hero reads as luminous rather than dense.
 */
export function createHeroMist(): HeroMist {
  const geometry = new PlaneGeometry(1, 1);
  const material = new ShaderMaterial({
    uniforms: {
      uColour: { value: rawColor(MIST_COLOUR) },
      uLight: { value: rawColor(MIST_LIGHT) },
      uStrength: { value: 0 },
      uTime: { value: 0 },
    },
    vertexShader: VERTEX,
    fragmentShader: VEILS_FRAGMENT,
    // Opaque pass, after the floor and before the chain; added as light
    transparent: false,
    blending: CustomBlending,
    blendSrc: OneFactor,
    blendDst: OneFactor,
    depthTest: false,
    depthWrite: false,
    fog: false,
  });
  const mesh = new Mesh(geometry, material);
  mesh.position.z = MIST_Z;
  mesh.renderOrder = -0.5;
  mesh.frustumCulled = false;
  mesh.visible = false;
  let time = 0;

  return {
    mesh,
    setPresence(presence) {
      const strength = MIST_STRENGTH * presence;
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
    tick(dt) {
      time += dt;
      const uniform = material.uniforms.uTime;
      if (uniform) uniform.value = time;
    },
    dispose() {
      geometry.dispose();
      material.dispose();
    },
  };
}
