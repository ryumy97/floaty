import { forwardRef, useCallback, useRef, type HTMLAttributes } from 'react';
import { useStore } from 'zustand';
import { floatyStore } from './store';
import { useRectTracker } from './useRectTracker';
import { useIsomorphicLayoutEffect } from './utils';

export interface FloatyAnchorProps extends HTMLAttributes<HTMLDivElement> {
  /** Links this anchor to the `<Floaty>` with the same `floatyId`. */
  floatyId: string;
}

/**
 * Placeholder that reserves layout space for a `<Floaty>` with the same
 * `floatyId`. When several anchors share it, the most recently mounted one is active.
 */
export const FloatyAnchor = forwardRef<HTMLDivElement, FloatyAnchorProps>(
  function FloatyAnchor({ floatyId, ...rest }, forwardedRef) {
    const elRef = useRef<HTMLDivElement | null>(null);

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
      return floatyStore.getState().registerAnchor(floatyId, el);
    }, [floatyId]);

    const isActive = useStore(
      floatyStore,
      (state) =>
        elRef.current !== null && state.snapshots[floatyId]?.anchor === elRef.current,
    );

    useRectTracker(floatyId, elRef, isActive);

    // Catch position changes caused by re-renders that don't resize the anchor.
    useIsomorphicLayoutEffect(() => {
      if (isActive) floatyStore.getState().measure(floatyId, 'layout');
    });

    return <div ref={ref} data-floaty-anchor={floatyId} {...rest} />;
  },
);
