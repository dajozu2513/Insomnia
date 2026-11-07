import { useEffect, useRef, useState } from 'react';

import { usePrefersReducedMotion } from '../../hooks/usePrefersReducedMotion';
import { getNightProgress, subscribeNightProgress } from '../night/night';
import { useChainAnchorRegistry } from './anchors/useChainAnchors';
import type { ChainScene } from './types';
import './ChainStage.css';

/** Set before first paint by the inline script in index.html when WebGL exists. */
const HAS_3D_CLASS = 'has-3d';

type Status = 'loading' | 'ready' | 'failed';

function has3d(): boolean {
  return document.documentElement.classList.contains(HAS_3D_CLASS);
}

/**
 * The fixed, full-viewport stage behind the page (z-index -1). It owns the
 * chain engine's lifecycle; the engine itself (and three.js) is loaded with a
 * dynamic import so it stays out of the main bundle. If the import or WebGL
 * fails, `has-3d` is removed from <html> and the stage unmounts, so the hero
 * and bands show their photos instead.
 */
export function ChainStage() {
  const registry = useChainAnchorRegistry();
  const reducedMotion = usePrefersReducedMotion();
  const stageRef = useRef<HTMLDivElement>(null);
  const engineRef = useRef<ChainScene | null>(null);
  const reducedMotionRef = useRef(reducedMotion);
  const [status, setStatus] = useState<Status>(() => (has3d() ? 'loading' : 'failed'));

  useEffect(() => {
    reducedMotionRef.current = reducedMotion;
    engineRef.current?.setReducedMotion(reducedMotion);
  }, [reducedMotion]);

  useEffect(() => {
    const stage = stageRef.current;
    if (!stage || !has3d()) return;

    // StrictMode mounts, cleans up and mounts again before the import resolves:
    // `cancelled` makes the first mount's import a no-op, so only one engine exists.
    let cancelled = false;
    let engine: ChainScene | null = null;
    let unsubscribe: (() => void) | undefined;

    const fail = () => {
      document.documentElement.classList.remove(HAS_3D_CLASS);
      setStatus('failed');
    };

    import('./engine/createChainScene')
      .then(({ createChainScene }) => {
        if (cancelled) return;
        try {
          engine = createChainScene(stage, {
            getAnchors: registry.getAnchors,
            reducedMotion: reducedMotionRef.current,
            night: { get: getNightProgress, subscribe: subscribeNightProgress },
            onReady: () => {
              setStatus('ready');
            },
          });
        } catch {
          fail();
          return;
        }
        engineRef.current = engine;
        unsubscribe = registry.subscribe(() => {
          engine?.rebuild();
        });
      })
      .catch(() => {
        if (!cancelled) fail();
      });

    return () => {
      cancelled = true;
      unsubscribe?.();
      engine?.dispose();
      engine = null;
      engineRef.current = null;
    };
  }, [registry]);

  if (status === 'failed') return null;

  return (
    <div
      ref={stageRef}
      className={status === 'ready' ? 'chain-stage is-ready' : 'chain-stage'}
      aria-hidden="true"
    />
  );
}
