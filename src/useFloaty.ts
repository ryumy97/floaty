import { useCallback } from 'react';
import { useStore } from 'zustand';
import { floatyStore, selectSnapshot } from './store';
import type { FloatyRect } from './types';

export interface FloatyStatus<S = unknown> {
  /** Whether an anchor for this floatyId is currently mounted. */
  hasAnchor: boolean;
  /** Whether the floating content is transitioning between positions. */
  isAnimating: boolean;
  /** Last known viewport rect of the active anchor. */
  rect: FloatyRect | null;
  /** `state` prop of the active anchor (or the last active one). */
  state: S | undefined;
  /** Force a re-measure of the active anchor (e.g. after a CSS-only layout change). */
  remeasure: () => void;
}

export function useFloaty<S = unknown>(floatyId: string): FloatyStatus<S> {
  const snapshot = useStore(floatyStore, selectSnapshot(floatyId));
  const remeasure = useCallback(
    () => floatyStore.getState().measure(floatyId, 'layout'),
    [floatyId],
  );

  return {
    hasAnchor: snapshot.anchor !== null,
    isAnimating: snapshot.isAnimating,
    rect: snapshot.rect,
    state: snapshot.state as S | undefined,
    remeasure,
  };
}
