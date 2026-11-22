import { useSyncExternalStore } from 'react';

import type { RackController, RackHooks } from '../chain/types';

/*
 * Between the 3D rack (engine, built at idle) and the T-shirt section's DOM
 * (features/rack/TeeRack.tsx): plain state outside React. ChainStage hands
 * `rackHooks` to the engine; the section reads the state with useRackState()
 * and drives the rack with rackController().
 */

export type RackStatus = 'pending' | 'ready' | 'failed';

interface RackState {
  status: RackStatus;
  /** The tee facing the visitor (index into TEES). */
  facing: number;
}

let state: RackState = { status: 'pending', facing: 0 };
let controller: RackController | null = null;
const listeners = new Set<() => void>();

function set(next: Partial<RackState>): void {
  if (next.status === state.status && (next.facing ?? state.facing) === state.facing) return;
  state = { ...state, ...next };
  listeners.forEach((listener) => {
    listener();
  });
}

export const rackHooks: RackHooks = {
  onReady(next) {
    controller = next;
    set({ status: 'ready' });
  },
  onFacing(index) {
    set({ facing: index });
  },
  onFailed() {
    controller = null;
    set({ status: 'failed' });
  },
};

/** The engine went away (the home page unmounted, or a lost context): wait for the next one. */
export function resetRack(): void {
  controller = null;
  if (state.status === 'ready') set({ status: 'pending' });
}

export function rackController(): RackController | null {
  return controller;
}

function subscribe(listener: () => void): () => void {
  listeners.add(listener);
  return () => {
    listeners.delete(listener);
  };
}

const snapshot = (): RackState => state;

export function useRackState(): RackState {
  return useSyncExternalStore(subscribe, snapshot, snapshot);
}
