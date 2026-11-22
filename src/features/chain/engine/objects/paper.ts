import {
  type CanvasTexture,
  DoubleSide,
  InstancedBufferAttribute,
  InstancedMesh,
  Matrix4,
  MeshStandardMaterial,
  PlaneGeometry,
} from 'three';

import { CARD_COLUMNS, CARD_ROWS } from './textures';

/*
 * Instanced paper: loose pages that flutter as they fall, the pages of the
 * open books turning over, and the playing cards of our deck. Each is one
 * InstancedMesh on a MeshStandardMaterial (so it is lit and fogged like the
 * porcelain), extended in onBeforeCompile.
 */

/** A matrix that collapses an instance to nothing (hidden). */
const ZERO = new Matrix4().makeScale(0, 0, 0);

export interface Paper {
  mesh: InstancedMesh;
  /**
   * Places page `i`. `bend` = [rest, amplitude, rate, phase]: the page arches by
   * rest + amplitude * sin(time * rate + phase) (fraction of its width).
   */
  set: (i: number, matrix: Matrix4, bend: readonly [number, number, number, number]) => void;
  hide: (i: number) => void;
  /** Advances the flutter (unchanged with reduced motion). */
  setTime: (time: number) => void;
  commit: () => void;
  dispose: () => void;
}

/**
 * Pages: a plane from x 0 to 1 (hinged at x 0, so a book's page turns about its
 * spine), y -0.5 to 0.5, gently bent in the vertex shader.
 */
export function createPaper(count: number, texture: CanvasTexture, small: boolean): Paper {
  const geometry = new PlaneGeometry(1, 1, small ? 6 : 10, small ? 2 : 3).translate(0.5, 0, 0);
  const bend = new Float32Array(count * 4);
  const attribute = new InstancedBufferAttribute(bend, 4);
  geometry.setAttribute('aBend', attribute);
  const uTime = { value: 0 };
  const material = new MeshStandardMaterial({
    map: texture,
    roughness: 0.9,
    metalness: 0,
    side: DoubleSide,
    envMapIntensity: 0.6,
  });
  material.onBeforeCompile = (shader) => {
    shader.uniforms.uTime = uTime;
    shader.vertexShader = shader.vertexShader
      .replace(
        '#include <common>',
        /* glsl */ `#include <common>
        attribute vec4 aBend;
        uniform float uTime;`,
      )
      .replace(
        '#include <beginnormal_vertex>',
        /* glsl */ `
        // The page arches along its width; a second, smaller wave runs down it
        float arch = aBend.x + aBend.y * sin(uTime * aBend.z + aBend.w);
        float wave = aBend.y * 0.35 * sin(uTime * aBend.z * 1.3 + position.y * 3.0 + aBend.w);
        float slope = arch * 3.14159 * cos(3.14159 * position.x) + wave;
        vec3 objectNormal = normalize(vec3(-slope, 0.0, 1.0));
        #ifdef USE_TANGENT
          vec3 objectTangent = vec3(tangent.xyz);
        #endif`,
      )
      .replace(
        '#include <begin_vertex>',
        /* glsl */ `#include <begin_vertex>
        transformed.z += arch * sin(3.14159 * position.x) + wave * position.x;`,
      );
  };
  const mesh = new InstancedMesh(geometry, material, count);
  mesh.frustumCulled = false;

  return {
    mesh,
    set(i, matrix, b) {
      mesh.setMatrixAt(i, matrix);
      bend.set(b, i * 4);
    },
    hide(i) {
      bend.set([0, 0, 0, 0], i * 4);
      mesh.setMatrixAt(i, ZERO);
    },
    setTime(time) {
      uTime.value = time;
    },
    commit() {
      mesh.instanceMatrix.needsUpdate = true;
      attribute.needsUpdate = true;
    },
    dispose() {
      geometry.dispose();
      material.dispose();
    },
  };
}

export interface Cards {
  mesh: InstancedMesh;
  /** Places card `i` with face `face` (index into the deck, 0..8). */
  set: (i: number, matrix: Matrix4, face: number) => void;
  hide: (i: number) => void;
  commit: () => void;
  dispose: () => void;
}

/**
 * Cards: a playing-card plane whose front shows its face from the atlas and
 * whose back shows the chessboard back (the last atlas cell).
 */
export function createCards(count: number, atlas: CanvasTexture): Cards {
  const geometry = new PlaneGeometry(0.25, 0.35);
  const faces = new Float32Array(count);
  const attribute = new InstancedBufferAttribute(faces, 1);
  geometry.setAttribute('aFace', attribute);
  const material = new MeshStandardMaterial({
    map: atlas,
    roughness: 0.55,
    metalness: 0,
    side: DoubleSide,
    alphaTest: 0.5,
    envMapIntensity: 0.7,
  });
  const back = CARD_COLUMNS * CARD_ROWS - 1;
  material.onBeforeCompile = (shader) => {
    shader.vertexShader = shader.vertexShader
      .replace(
        '#include <common>',
        '#include <common>\nattribute float aFace;\nvarying float vFace;',
      )
      .replace('#include <begin_vertex>', '#include <begin_vertex>\nvFace = aFace;');
    shader.fragmentShader = shader.fragmentShader
      .replace('#include <common>', '#include <common>\nvarying float vFace;')
      .replace(
        '#include <map_fragment>',
        /* glsl */ `
        float cellIndex = gl_FrontFacing ? vFace : ${back.toFixed(1)};
        vec2 cell = vec2(mod(cellIndex, ${CARD_COLUMNS.toFixed(1)}), floor(cellIndex / ${CARD_COLUMNS.toFixed(1)}));
        vec2 local = vec2(gl_FrontFacing ? vMapUv.x : 1.0 - vMapUv.x, vMapUv.y);
        vec2 atlasUv = vec2(
          (cell.x + local.x) / ${CARD_COLUMNS.toFixed(1)},
          1.0 - (cell.y + 1.0 - local.y) / ${CARD_ROWS.toFixed(1)}
        );
        diffuseColor *= texture2D(map, atlasUv);`,
      );
  };
  const mesh = new InstancedMesh(geometry, material, count);
  mesh.frustumCulled = false;
  return {
    mesh,
    set(i, matrix, face) {
      mesh.setMatrixAt(i, matrix);
      faces[i] = face;
    },
    hide(i) {
      mesh.setMatrixAt(i, ZERO);
    },
    commit() {
      mesh.instanceMatrix.needsUpdate = true;
      attribute.needsUpdate = true;
    },
    dispose() {
      geometry.dispose();
      material.dispose();
    },
  };
}
