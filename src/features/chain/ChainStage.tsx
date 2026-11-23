import { useEffect, useRef, useState } from 'react';

import { usePrefersReducedMotion } from '../../hooks/usePrefersReducedMotion';
import { TEES } from '../../data/tees';
import { FALL_OVERRIDE, LAND_OVERRIDE, RACK_OVERRIDE, WORD_OVERRIDE } from '../fall/fall';
import { loadFallObjects, teeAtlasCell } from '../fall/objectData';
import { isDialogOpen, subscribeDialogs } from '../product/dialogPresence';
import { rackHooks, resetRack } from '../rack/rackBridge';
import { renderTeeAtlas } from '../rack/teeAtlas';
import { useI18n } from '../../i18n';
import { getNightProgress, subscribeNightProgress } from '../night/night';
import { useChainAnchorRegistry } from './anchors/useChainAnchors';
import type { ChainScene, ChainSceneOptions, FallLabels } from './types';
import './ChainStage.css';

/** Set before first paint by the inline script in index.html when WebGL exists. */
const HAS_3D_CLASS = 'has-3d';
/** On <html> once the live scene has drawn: the hero's still crossfades away (Hero.css). */
const LIVE_CLASS = 'chain-live';

type Status = 'loading' | 'ready' | 'failed';

type CreateChainScene = (container: HTMLElement, options: ChainSceneOptions) => ChainScene;

/** While the first-visit intro covers the page (IntroSplash, set before first paint). */
const INTRO_PENDING_CLASS = 'intro-pending';
/** After the intro lifts, the hero title's letters start to paint within this long. */
const TITLE_ENTRANCE_MS = 700;

/**
 * Resolves once the intro (if it shows) has lifted and the hero title has begun
 * its entrance: the engine's start-up is the page's longest task, and it must
 * not land on the title's first paint (the largest contentful paint).
 */
function afterIntro(): Promise<void> {
  const root = document.documentElement;
  if (!root.classList.contains(INTRO_PENDING_CLASS)) return Promise.resolve();
  return new Promise((resolve) => {
    const finish = () => {
      observer.disconnect();
      window.clearTimeout(safety);
      window.setTimeout(resolve, TITLE_ENTRANCE_MS);
    };
    const observer = new MutationObserver(() => {
      if (!root.classList.contains(INTRO_PENDING_CLASS)) finish();
    });
    observer.observe(root, { attributes: true, attributeFilter: ['class'] });
    // Never wait for ever (the intro holds about 2 s)
    const safety = window.setTimeout(finish, 6000);
  });
}

/** Resolves once fonts are ready, the intro is over and the browser is idle (or after a short wait). */
function afterFirstPaint(): Promise<void> {
  return Promise.all([document.fonts.ready, afterIntro()]).then(
    () =>
      new Promise<void>((resolve) => {
        if ('requestIdleCallback' in window) {
          window.requestIdleCallback(
            () => {
              resolve();
            },
            { timeout: 800 },
          );
        } else {
          setTimeout(resolve, 120);
        }
      }),
  );
}

/** Context losses survived before the scene gives way to the stills for this visit. */
const MAX_CONTEXT_LOSSES = 3;

function has3d(): boolean {
  return document.documentElement.classList.contains(HAS_3D_CLASS);
}

/**
 * The fixed, full-viewport stage behind the page (z-index -1). It owns the
 * chain engine's lifecycle; the engine itself (and three.js) is loaded with a
 * dynamic import so it stays out of the main bundle. If the import or WebGL
 * fails, `has-3d` is removed from <html> and the stage unmounts, so the hero
 * and bands show their stills instead.
 */
export function ChainStage() {
  const registry = useChainAnchorRegistry();
  const reducedMotion = usePrefersReducedMotion();
  const stageRef = useRef<HTMLDivElement>(null);
  const engineRef = useRef<ChainScene | null>(null);
  const reducedMotionRef = useRef(reducedMotion);
  const { t, lang } = useI18n();
  const labels: FallLabels = t.home.fall;
  const labelsRef = useRef(labels);
  const langRef = useRef(lang);
  const [status, setStatus] = useState<Status>(() => (has3d() ? 'loading' : 'failed'));

  // A product dialog covers the page: the scene waits (the jewelry preview renders instead)
  useEffect(
    () =>
      subscribeDialogs(() => {
        engineRef.current?.setPaused(isDialogOpen());
      }),
    [],
  );

  useEffect(() => {
    reducedMotionRef.current = reducedMotion;
    engineRef.current?.setReducedMotion(reducedMotion);
  }, [reducedMotion]);

  // The bottle's tag and the cake's currants follow the site language
  useEffect(() => {
    labelsRef.current = labels;
    engineRef.current?.setLabels(labels);
  }, [labels]);

  // The rack's prints carry the meaning in the site language: redrawn when it changes
  useEffect(() => {
    if (langRef.current === lang) return;
    langRef.current = lang;
    let cancelled = false;
    renderTeeAtlas(lang, teeAtlasCell())
      .then((atlas) => {
        if (!cancelled) engineRef.current?.setTeeAtlas(atlas);
      })
      .catch((error: unknown) => {
        console.error('The prints for the rack could not be redrawn', error);
      });
    return () => {
      cancelled = true;
    };
  }, [lang]);

  useEffect(() => {
    const stage = stageRef.current;
    if (!stage || !has3d()) return;

    // StrictMode mounts, cleans up and mounts again before the import resolves:
    // `cancelled` makes the first mount's import a no-op, so only one engine exists.
    let cancelled = false;
    let engine: ChainScene | null = null;
    let unsubscribe: (() => void) | undefined;

    let losses = 0;
    let waitForVisible: (() => void) | undefined;

    const fail = () => {
      document.documentElement.classList.remove(HAS_3D_CLASS, LIVE_CLASS);
      setStatus('failed');
      // No scene, no rack: the T-shirt section shows its grid
      rackHooks.onFailed();
    };

    const start = (createChainScene: CreateChainScene) => {
      if (cancelled) return;
      try {
        engine = createChainScene(stage, {
          getAnchors: registry.getAnchors,
          reducedMotion: reducedMotionRef.current,
          night: { get: getNightProgress, subscribe: subscribeNightProgress },
          fall: FALL_OVERRIDE,
          holdWord: WORD_OVERRIDE !== null,
          land: LAND_OVERRIDE,
          objects: () => loadFallObjects(labelsRef.current, langRef.current),
          rack: rackHooks,
          rackHold:
            RACK_OVERRIDE === null
              ? null
              : Math.max(
                  TEES.findIndex((tee) => tee.id === RACK_OVERRIDE),
                  0,
                ),
          onReady: () => {
            setStatus('ready');
            document.documentElement.classList.add(LIVE_CLASS);
          },
          // The browser dropped the WebGL context (a phone backgrounding the tab, a GPU
          // reset): free the dead engine and build a new one on a fresh canvas once the
          // tab is visible again. After MAX_CONTEXT_LOSSES the stills take over.
          onContextLost: () => {
            engine?.dispose();
            engine = null;
            engineRef.current = null;
            resetRack();
            losses += 1;
            if (losses > MAX_CONTEXT_LOSSES) {
              fail();
              return;
            }
            const restart = () => {
              if (document.hidden) return;
              document.removeEventListener('visibilitychange', restart);
              waitForVisible = undefined;
              start(createChainScene);
            };
            waitForVisible = restart;
            document.addEventListener('visibilitychange', restart);
            restart();
          },
        });
      } catch {
        fail();
        return;
      }
      engineRef.current = engine;
      engine.setPaused(isDialogOpen());
    };

    // Load three.js once the first paint is done (fonts in, main thread idle), so the
    // engine's download and start-up never compete with the intro and the hero title.
    afterFirstPaint()
      .then(() => import('./engine/createChainScene'))
      .then(({ createChainScene }) => {
        if (cancelled) return;
        start(createChainScene);
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
      if (waitForVisible) document.removeEventListener('visibilitychange', waitForVisible);
      engine?.dispose();
      engine = null;
      engineRef.current = null;
      resetRack();
      document.documentElement.classList.remove(LIVE_CLASS);
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
