import type { RefObject } from 'react';
import { observeMove } from './observeMove';
import { floatyStore } from './store';
import { useIsomorphicLayoutEffect } from './utils';

/** Moves seen this soon after a scroll or resize event are attributed to it. */
const SCROLL_ATTRIBUTION_MS = 100;

/**
 * While the referenced element is the active anchor for `floatyId`, keeps its
 * rect in the store up to date on resize (ResizeObserver), moves without resize
 * (IntersectionObserver), window resize and any scroll.
 */
export function useRectTracker(
  floatyId: string,
  elRef: RefObject<HTMLElement | null>,
  isActive: boolean,
) {
  useIsomorphicLayoutEffect(() => {
    const el = elRef.current;
    if (!el || !isActive) return;

    let frame = 0;
    let pendingReason: 'layout' | 'scroll' = 'scroll';
    let lastScroll = -Infinity;
    const schedule = (reason: 'layout' | 'scroll') => {
      if (reason === 'layout') pendingReason = 'layout';
      if (frame) return;
      frame = requestAnimationFrame(() => {
        frame = 0;
        floatyStore.getState().measure(floatyId, pendingReason);
        pendingReason = 'scroll';
      });
    };

    const onScroll = () => {
      lastScroll = performance.now();
      schedule('scroll');
    };
    const resizeObserver =
      typeof ResizeObserver !== 'undefined'
        ? new ResizeObserver(() => schedule('layout'))
        : null;
    resizeObserver?.observe(el);
    // Scrolling also moves the anchor, so only unexplained moves count as layout.
    const stopObservingMoves = observeMove(el, () =>
      schedule(performance.now() - lastScroll < SCROLL_ATTRIBUTION_MS ? 'scroll' : 'layout'),
    );
    window.addEventListener('scroll', onScroll, { capture: true, passive: true });
    window.addEventListener('resize', onScroll, { passive: true });

    return () => {
      if (frame) cancelAnimationFrame(frame);
      resizeObserver?.disconnect();
      stopObservingMoves();
      window.removeEventListener('scroll', onScroll, { capture: true });
      window.removeEventListener('resize', onScroll);
    };
  }, [floatyId, elRef, isActive]);
}
