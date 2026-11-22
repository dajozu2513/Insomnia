import { useEffect, useRef, useState, type KeyboardEvent, type PointerEvent } from 'react';

import { ErrorBoundary } from '../../components/ErrorBoundary';
import { findTee, TEES } from '../../data/tees';
import { FADE_THRESHOLD, REVEAL_THRESHOLD, useInView } from '../../hooks/useInView';
import { useI18n } from '../../i18n';
import { useChainRack } from '../chain';
import { HomeSection } from '../home/HomeSection';
import { useProductDialog } from '../product/useProductDialog';
import { TeeDialog } from '../tees/TeeDialog';
import { TeeGrid } from '../tees/TeeGrid';
import { rackController, useRackState } from './rackBridge';
import { rackColour } from './teeAtlas';
import '../tees/tees.css';
import './rack.css';

/** A horizontal movement this long (px) makes a press a drag of the rack, not a tap. */
const DRAG_START = 8;

function has3d(): boolean {
  return document.documentElement.classList.contains('has-3d');
}

/**
 * The printed T-shirts (step 14; docs/brand/design-direction.md, "The clothing
 * rack"): a window onto the shaft where the ten tees hang on a floating rack
 * (the 3D scene). Without WebGL, or if the rack cannot be built, the section is
 * the step 7 grid on bone, unchanged.
 */
export function TeeRack() {
  const { t } = useI18n();
  const { tshirts } = t.home;
  const { status } = useRackState();
  const [scene] = useState(has3d);

  if (!scene || status === 'failed') {
    return (
      <HomeSection id="tshirts" lead={tshirts.lead} em={tshirts.em}>
        <ErrorBoundary name="T-shirts">
          <TeeGrid />
        </ErrorBoundary>
      </HomeSection>
    );
  }
  return <RackSection />;
}

interface Press {
  id: number;
  x: number;
  y: number;
  lastX: number;
  lastT: number;
  velocity: number;
  mode: 'pending' | 'drag' | 'scroll';
}

function RackSection() {
  const { t } = useI18n();
  const { tshirts } = t.home;
  const copy = t.home.tees;
  const { status, facing } = useRackState();
  const ready = status === 'ready';
  const dialog = useProductDialog('tee', findTee);
  const [section, setSection] = useState<HTMLElement | null>(null);
  const [stage, setStage] = useState<HTMLDivElement | null>(null);
  useChainRack(section, stage);
  const ghostRef = useRef<HTMLSpanElement>(null);
  const press = useRef<Press | null>(null);
  const [headerRef, headerVisible] = useInView<HTMLElement>(FADE_THRESHOLD);
  const [titleRef, titleVisible] = useInView<HTMLHeadingElement>(REVEAL_THRESHOLD);
  const facingTee = TEES[facing] ?? TEES[0];

  /** Opens a tee's dialog, its mockup flying from the 3D tee's place on screen. */
  const open = (index: number) => {
    const tee = TEES[index];
    if (!tee) return;
    const rect = rackController()?.rect(index);
    const ghost = ghostRef.current;
    if (ghost && rect) {
      ghost.style.left = `${String(rect.left)}px`;
      ghost.style.top = `${String(rect.top)}px`;
      ghost.style.width = `${String(rect.width)}px`;
      ghost.style.height = `${String(rect.height)}px`;
      dialog.sourceRef(tee.id)(ghost);
    }
    dialog.openItem(tee);
  };

  /** A tee chosen (a name, a tap on the rack): turn to it first; when it faces the visitor, open it. */
  const choose = (index: number) => {
    const controller = rackController();
    if (!controller || index === facing) open(index);
    else controller.goTo(index);
  };

  // A deep link (?tee=) opens the dialog on load: turn the rack to that tee too
  const openId = dialog.open?.item.id;
  useEffect(() => {
    if (!ready || !openId) return;
    const index = TEES.findIndex((tee) => tee.id === openId);
    if (index >= 0) rackController()?.goTo(index);
  }, [ready, openId]);

  const onPointerDown = (e: PointerEvent<HTMLDivElement>) => {
    if (e.pointerType === 'mouse' && e.button !== 0) return;
    press.current = {
      id: e.pointerId,
      x: e.clientX,
      y: e.clientY,
      lastX: e.clientX,
      lastT: e.timeStamp,
      velocity: 0,
      mode: 'pending',
    };
  };

  const onPointerMove = (e: PointerEvent<HTMLDivElement>) => {
    const p = press.current;
    if (p?.id !== e.pointerId) return;
    const dx = e.clientX - p.x;
    const dy = e.clientY - p.y;
    if (p.mode === 'pending') {
      // Horizontal drags turn the rack; vertical ones are the page scrolling
      if (Math.abs(dx) > DRAG_START && Math.abs(dx) > Math.abs(dy)) {
        p.mode = 'drag';
        e.currentTarget.setPointerCapture(e.pointerId);
      } else if (Math.abs(dy) > DRAG_START) {
        p.mode = 'scroll';
      }
    }
    if (p.mode !== 'drag') return;
    const step = e.clientX - p.lastX;
    const dt = e.timeStamp - p.lastT;
    rackController()?.drag(step);
    if (dt > 0) p.velocity = 0.75 * ((step / dt) * 1000) + 0.25 * p.velocity;
    p.lastX = e.clientX;
    p.lastT = e.timeStamp;
  };

  const onPointerUp = (e: PointerEvent<HTMLDivElement>) => {
    const p = press.current;
    press.current = null;
    if (p?.id !== e.pointerId) return;
    const controller = rackController();
    if (p.mode === 'drag') {
      // A drag that stopped before letting go has no speed left
      controller?.release(e.timeStamp - p.lastT > 80 ? 0 : p.velocity);
      return;
    }
    if (p.mode === 'pending') {
      const index = controller?.pick(e.clientX, e.clientY);
      if (index !== null && index !== undefined) choose(index);
    }
  };

  const onPointerCancel = () => {
    if (press.current?.mode === 'drag') rackController()?.release(0);
    press.current = null;
  };

  const onKeyDown = (e: KeyboardEvent<HTMLDivElement>) => {
    const controller = rackController();
    if (e.key === 'ArrowLeft' || e.key === 'ArrowRight') {
      e.preventDefault();
      controller?.step(e.key === 'ArrowRight' ? 1 : -1);
    } else if (e.key === 'Enter' || e.key === ' ') {
      e.preventDefault();
      open(facing);
    }
  };

  const hold = (on: boolean) => {
    rackController()?.hold(on);
  };

  return (
    <section ref={setSection} className="rack-section" aria-labelledby="tshirts-title">
      <header
        ref={headerRef}
        className={headerVisible ? 'section-header visible' : 'section-header'}
      >
        <h2
          ref={titleRef}
          id="tshirts-title"
          className={titleVisible ? 'section-title visible' : 'section-title'}
        >
          <span className="reveal-wrap">
            <span className="reveal-line">
              {tshirts.lead}
              {tshirts.em && (
                <>
                  {' '}
                  <em>{tshirts.em}</em>
                </>
              )}
            </span>
          </span>
        </h2>
      </header>

      {/* The rack itself is drawn by the 3D scene behind this transparent stage */}
      <div
        ref={setStage}
        className="rack-stage"
        role="group"
        aria-label={copy.rack.label}
        aria-describedby="rack-facing"
        tabIndex={0}
        onPointerDown={onPointerDown}
        onPointerMove={onPointerMove}
        onPointerUp={onPointerUp}
        onPointerCancel={onPointerCancel}
        onPointerEnter={(e) => {
          if (e.pointerType === 'mouse') hold(true);
        }}
        onPointerLeave={(e) => {
          if (e.pointerType === 'mouse') hold(false);
        }}
        onFocus={() => {
          hold(true);
        }}
        onBlur={() => {
          hold(false);
        }}
        onKeyDown={onKeyDown}
      >
        <span ref={ghostRef} className="rack-ghost" aria-hidden="true" />
      </div>

      <div className="rack-controls">
        <button
          type="button"
          className="rack-arrow"
          aria-label={copy.rack.previous}
          disabled={!ready}
          onClick={() => rackController()?.step(-1)}
        >
          <svg viewBox="0 0 24 24" aria-hidden="true" focusable="false">
            <path d="M15 5 8 12l7 7" />
          </svg>
        </button>
        <p id="rack-facing" className="rack-facing">
          <span className="rack-facing-name">{facingTee?.word}</span>
        </p>
        <button
          type="button"
          className="rack-arrow"
          aria-label={copy.rack.next}
          disabled={!ready}
          onClick={() => rackController()?.step(1)}
        >
          <svg viewBox="0 0 24 24" aria-hidden="true" focusable="false">
            <path d="M9 5l7 7-7 7" />
          </svg>
        </button>
      </div>

      <ul className="rack-names" aria-label={copy.listLabel}>
        {TEES.map((tee, i) => (
          <li key={tee.id}>
            <button
              ref={dialog.triggerRef(tee.id)}
              type="button"
              className="rack-name"
              aria-current={i === facing ? 'true' : undefined}
              aria-haspopup="dialog"
              onClick={() => {
                choose(i);
              }}
            >
              {tee.word}
              <span className="visually-hidden">, {copy.item}</span>
            </button>
          </li>
        ))}
      </ul>

      <p className="tees-credit rack-credit">
        {copy.credit.before}
        <cite>{copy.credit.title}</cite>
        {copy.credit.after}
      </p>

      {dialog.open && (
        <TeeDialog
          key={dialog.open.item.id}
          tee={dialog.open.item}
          source={dialog.open.source}
          sourceCrop={null}
          previewColour={rackColour(TEES.findIndex((tee) => tee.id === dialog.open?.item.id))}
          previewPlacement="front"
          onClose={dialog.closeItem}
        />
      )}
    </section>
  );
}
