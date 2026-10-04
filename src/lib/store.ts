"use client";

import { useSyncExternalStore } from "react";

/** Minimal global store (no dependency): sound toggle, menu state, current act, scroll progress. */
type State = {
  sound: boolean;
  menuOpen: boolean;
  act: number;
  progress: number;
  igniting: boolean;
};

let state: State = { sound: false, menuOpen: false, act: 0, progress: 0, igniting: false };
const listeners = new Set<() => void>();

export const store = {
  get: () => state,
  set(patch: Partial<State>) {
    let changed = false;
    for (const k in patch) {
      const key = k as keyof State;
      if (state[key] !== patch[key]) changed = true;
    }
    if (!changed) return;
    state = { ...state, ...patch };
    listeners.forEach((l) => l());
  },
  subscribe(l: () => void) {
    listeners.add(l);
    return () => listeners.delete(l);
  },
};

const serverState = state;
export function useStore<T>(select: (s: State) => T): T {
  return useSyncExternalStore(
    store.subscribe,
    () => select(store.get()),
    () => select(serverState),
  );
}
