/*
 * One requestAnimationFrame per scroll for everything that follows the page:
 * the header hairline, the night clock, the photo-fallback parallax and (from
 * step 4) the 3D lighting. Listeners run in subscription order inside the same
 * frame and write to the DOM directly; nothing here touches React state.
 */

export interface ScrollFrame {
  scrollY: number;
  viewportHeight: number;
  /** Scrollable distance (document height minus viewport). */
  maxScroll: number;
  /**
   * Reading progress, 0..1: scrollY / maxScroll (0 when the page cannot scroll),
   * or, while a progress source is set (an article's text), how far through that
   * element the reader is. The header hairline and the night clock follow it.
   */
  progress: number;
}

type Listener = (frame: ScrollFrame) => void;

const listeners = new Set<Listener>();
let pending = 0;
let bodyObserver: ResizeObserver | null = null;
let progressSource: Element | null = null;

/**
 * Reading progress across one element (ported from the legacy article.js): 0
 * until its top passes 40% of the viewport, 1 once its bottom reaches the
 * viewport's bottom edge.
 */
function elementProgress(element: Element, viewportHeight: number): number {
  const rect = element.getBoundingClientRect();
  const total = Math.max(rect.height - viewportHeight * 0.6, 1);
  return Math.min(Math.max((-rect.top + viewportHeight * 0.4) / total, 0), 1);
}

function measure(): ScrollFrame {
  const scrollY = window.scrollY;
  const viewportHeight = window.innerHeight;
  const maxScroll = Math.max(document.documentElement.scrollHeight - viewportHeight, 0);
  const progress =
    progressSource?.isConnected === true
      ? elementProgress(progressSource, viewportHeight)
      : maxScroll > 0
        ? Math.min(Math.max(scrollY / maxScroll, 0), 1)
        : 0;
  return { scrollY, viewportHeight, maxScroll, progress };
}

function run(): void {
  pending = 0;
  const frame = measure();
  listeners.forEach((listener) => {
    listener(frame);
  });
}

function schedule(): void {
  if (!pending) pending = requestAnimationFrame(run);
}

function attach(): void {
  window.addEventListener('scroll', schedule, { passive: true });
  window.addEventListener('resize', schedule);
  // Content loading in (fonts, images, route changes) changes the page height.
  bodyObserver = new ResizeObserver(schedule);
  bodyObserver.observe(document.body);
}

function detach(): void {
  window.removeEventListener('scroll', schedule);
  window.removeEventListener('resize', schedule);
  bodyObserver?.disconnect();
  bodyObserver = null;
  if (pending) cancelAnimationFrame(pending);
  pending = 0;
}

/**
 * Calls `listener` on the next frame and on every frame after a scroll, resize
 * or body size change. Returns the unsubscribe function.
 */
export function subscribeScrollFrame(listener: Listener): () => void {
  listeners.add(listener);
  if (listeners.size === 1) attach();
  schedule(); // a reload can restore the page mid-scroll
  return () => {
    listeners.delete(listener);
    if (listeners.size === 0) detach();
  };
}

/**
 * Measures `progress` across `element` instead of the whole page (null restores
 * the page). Article pages set their text here, so the hairline and the watch
 * run from the start of the text (6:00 PM) to its end (6:00 AM).
 */
export function setProgressSource(element: Element | null): void {
  progressSource = element;
  if (listeners.size > 0) schedule();
}
