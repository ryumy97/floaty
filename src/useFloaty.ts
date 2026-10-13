import { useCallback, useRef, useSyncExternalStore } from 'react';
import { floatyStore, selectSnapshot } from './store';
import type { FloatyRect, FloatySnapshot } from './types';
import { useIsomorphicLayoutEffect } from './utils';

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

type Field = 'hasAnchor' | 'isAnimating' | 'rect' | 'state';
type Values = Pick<FloatyStatus, Field>;

const toValues = (snapshot: FloatySnapshot): Values => ({
  hasAnchor: snapshot.anchor !== null,
  isAnimating: snapshot.isAnimating,
  rect: snapshot.rect,
  state: snapshot.state,
});

/**
 * Status of a floatyId. Re-renders only when a field the component has read
 * changes, so reading `rect` opts into per-frame updates while scrolling.
 */
export function useFloaty<S = unknown>(floatyId: string): FloatyStatus<S> {
  const used = useRef(new Set<Field>()).current;
  const cache = useRef<{ floatyId: string; values: Values } | null>(null);

  const getSnapshot = useCallback(() => {
    const next = toValues(selectSnapshot(floatyId)(floatyStore.getState()));
    const prev = cache.current;
    if (prev?.floatyId === floatyId && [...used].every((f) => Object.is(prev.values[f], next[f]))) {
      // Same object so React bails out; unread fields stay fresh for later renders.
      return Object.assign(prev.values, next);
    }
    cache.current = { floatyId, values: next };
    return next;
  }, [floatyId, used]);

  const values = useSyncExternalStore(floatyStore.subscribe, getSnapshot, getSnapshot);
  useIsomorphicLayoutEffect(() => floatyStore.getState().retain(floatyId), [floatyId]);
  const remeasure = useCallback(
    () => floatyStore.getState().measure(floatyId, 'layout'),
    [floatyId],
  );

  const read = <F extends Field>(field: F): Values[F] => {
    used.add(field);
    return values[field];
  };
  return {
    get hasAnchor() {
      return read('hasAnchor');
    },
    get isAnimating() {
      return read('isAnimating');
    },
    get rect() {
      return read('rect');
    },
    get state() {
      return read('state') as S | undefined;
    },
    remeasure,
  };
}
