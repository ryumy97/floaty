import type { RefObject } from 'react';
import { floatyStore } from './store';
import { useIsomorphicLayoutEffect } from './utils';

/**
 * While the referenced element is the active anchor for `floatyId`, keeps its
 * rect in the store up to date on resize (ResizeObserver), window resize and any scroll.
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
    const schedule = (reason: 'layout' | 'scroll') => {
      if (reason === 'layout') pendingReason = 'layout';
      if (frame) return;
      frame = requestAnimationFrame(() => {
        frame = 0;
        floatyStore.getState().measure(floatyId, pendingReason);
        pendingReason = 'scroll';
      });
    };

    const onScroll = () => schedule('scroll');
    const resizeObserver =
      typeof ResizeObserver !== 'undefined'
        ? new ResizeObserver(() => schedule('layout'))
        : null;
    resizeObserver?.observe(el);
    window.addEventListener('scroll', onScroll, { capture: true, passive: true });
    window.addEventListener('resize', onScroll, { passive: true });

    return () => {
      if (frame) cancelAnimationFrame(frame);
      resizeObserver?.disconnect();
      window.removeEventListener('scroll', onScroll, { capture: true });
      window.removeEventListener('resize', onScroll);
    };
  }, [floatyId, elRef, isActive]);
}
