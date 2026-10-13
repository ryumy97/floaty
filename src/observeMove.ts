/**
 * Calls `onMove` whenever `el` moves, including moves that neither resize it
 * nor scroll anything (for example, a sibling above it growing). Uses an
 * IntersectionObserver whose root margin is shrunk to the element's own rect,
 * so any movement changes the intersection ratio. Returns a cleanup function;
 * a no-op where IntersectionObserver is unavailable.
 */
export function observeMove(el: Element, onMove: () => void): () => void {
  if (typeof IntersectionObserver === 'undefined') return () => {};
  const root = el.ownerDocument.documentElement;
  let observer: IntersectionObserver | null = null;
  let timeout: ReturnType<typeof setTimeout> | undefined;

  const cleanup = () => {
    clearTimeout(timeout);
    observer?.disconnect();
    observer = null;
  };

  const refresh = (notify: boolean, threshold = 1) => {
    cleanup();
    const rect = el.getBoundingClientRect();
    if (notify) onMove();
    if (!rect.width || !rect.height) return;

    const top = Math.floor(rect.top);
    const left = Math.floor(rect.left);
    const right = Math.floor(root.clientWidth - (rect.left + rect.width));
    const bottom = Math.floor(root.clientHeight - (rect.top + rect.height));
    const options: IntersectionObserverInit = {
      rootMargin: `${-top}px ${-right}px ${-bottom}px ${-left}px`,
      threshold: Math.max(0, Math.min(1, threshold)) || 1,
    };

    let first = true;
    const handle = (entries: IntersectionObserverEntry[]) => {
      const ratio = entries[entries.length - 1].intersectionRatio;
      if (ratio !== threshold) {
        if (!first) return refresh(true);
        // The first callback reports the starting ratio. Re-arm at that ratio
        // (partially visible) or, if fully outside the viewport, poll slowly.
        if (ratio) refresh(true, ratio);
        else timeout = setTimeout(() => refresh(true, 1e-7), 1000);
        return;
      }
      // Sub-pixel moves can keep the ratio at 1.
      if (ratio === 1 && !sameRect(rect, el.getBoundingClientRect())) return refresh(true);
      first = false;
    };

    try {
      observer = new IntersectionObserver(handle, { ...options, root: el.ownerDocument });
    } catch {
      observer = new IntersectionObserver(handle, options);
    }
    observer.observe(el);
  };

  refresh(false);
  return cleanup;
}

function sameRect(a: DOMRect, b: DOMRect) {
  return a.x === b.x && a.y === b.y && a.width === b.width && a.height === b.height;
}
