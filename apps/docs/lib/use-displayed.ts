'use client';

import { type RefObject, useLayoutEffect, useState } from 'react';

/**
 * Whether the element currently renders a box. Fumadocs renders some UI twice (desktop and
 * mobile) and hides one copy with CSS per breakpoint, so the displayed anchor should take
 * priority over the hidden one.
 */
export function useDisplayed(ref: RefObject<HTMLElement | null>) {
  const [displayed, setDisplayed] = useState(false);
  useLayoutEffect(() => {
    const el = ref.current!;
    const update = () => setDisplayed(el.getClientRects().length > 0);
    update();
    const observer = new ResizeObserver(update);
    observer.observe(el);
    return () => observer.disconnect();
  }, [ref]);
  return displayed;
}
