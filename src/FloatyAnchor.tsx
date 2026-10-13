import {
  forwardRef,
  useCallback,
  useRef,
  type HTMLAttributes,
  type ReactElement,
  type Ref,
} from 'react';
import { useStore } from 'zustand';
import { floatyStore } from './store';
import { useRectTracker } from './useRectTracker';
import { useIsomorphicLayoutEffect } from './utils';

export interface FloatyAnchorProps<S = unknown> extends HTMLAttributes<HTMLDivElement> {
  /** Links this anchor to the `<Floaty>` with the same `floatyId`. */
  floatyId: string;
  /**
   * Passed to the floating content while this anchor is active. Read it with
   * `useFloatyState()` inside the content, or a render-function child of `<Floaty>`.
   * Compared shallowly, so inline object literals are fine.
   */
  state?: S;
  /**
   * When several anchors share a `floatyId`, the one with the highest priority is
   * active; ties go to the most recently mounted. Defaults to `0`.
   */
  priority?: number;
}

/**
 * Placeholder that reserves layout space for a `<Floaty>` with the same
 * `floatyId`. When several anchors share it, the one with the highest `priority`
 * is active, and among equal priorities the most recently mounted one.
 */
export const FloatyAnchor = forwardRef<HTMLDivElement, FloatyAnchorProps>(
  function FloatyAnchor({ floatyId, state, priority = 0, ...rest }, forwardedRef) {
    const elRef = useRef<HTMLDivElement | null>(null);
    const stateRef = useRef(state);
    stateRef.current = state;
    const priorityRef = useRef(priority);
    priorityRef.current = priority;

    const ref = useCallback(
      (node: HTMLDivElement | null) => {
        elRef.current = node;
        if (typeof forwardedRef === 'function') forwardedRef(node);
        else if (forwardedRef) forwardedRef.current = node;
      },
      [forwardedRef],
    );

    // Registering in the same commit that removes a previous anchor lets
    // <Floaty> observe a direct anchor-to-anchor switch and animate it.
    useIsomorphicLayoutEffect(() => {
      const el = elRef.current;
      if (!el) return;
      return floatyStore
        .getState()
        .registerAnchor(floatyId, el, stateRef.current, priorityRef.current);
    }, [floatyId]);

    useIsomorphicLayoutEffect(() => {
      const el = elRef.current;
      if (el) floatyStore.getState().setAnchorPriority(floatyId, el, priority);
    }, [floatyId, priority]);

    useIsomorphicLayoutEffect(() => {
      const el = elRef.current;
      if (el) floatyStore.getState().setAnchorState(floatyId, el, state);
    }, [floatyId, state]);

    const isActive = useStore(
      floatyStore,
      (s) => elRef.current !== null && s.snapshots[floatyId]?.anchor === elRef.current,
    );

    useRectTracker(floatyId, elRef, isActive);

    // Catch position changes caused by re-renders that don't resize the anchor.
    useIsomorphicLayoutEffect(() => {
      if (isActive) floatyStore.getState().measure(floatyId, 'layout');
    });

    return <div ref={ref} data-floaty-anchor={floatyId} {...rest} />;
  },
) as <S = unknown>(
  props: FloatyAnchorProps<S> & { ref?: Ref<HTMLDivElement> },
) => ReactElement | null;
