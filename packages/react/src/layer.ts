import { useState } from 'react';
import { type FloatyConfig, floatyStore } from './store';
import { useIsomorphicLayoutEffect } from './utils';

function styleLayer(el: HTMLDivElement, config: FloatyConfig, zIndex?: number) {
  el.className = config.layerClassName ?? '';
  el.style.zIndex = String(zIndex ?? config.zIndex);
}

/**
 * Returns a private overlay layer appended to `document.body` for one `<Floaty>`,
 * creating it on mount and removing it on unmount. `null` during SSR and the
 * first client render. Pass `zIndex` to override `configureFloaty({ zIndex })`.
 */
export function useFloatyLayer(zIndex?: number): HTMLDivElement | null {
  const [el, setEl] = useState<HTMLDivElement | null>(null);

  useIsomorphicLayoutEffect(() => {
    const layer = document.createElement('div');
    layer.setAttribute('data-floaty-layer', '');
    // Absolute at the document origin, so page scroll moves floaties natively
    // instead of waiting for a JS re-measure.
    Object.assign(layer.style, {
      position: 'absolute',
      top: '0',
      left: '0',
      width: '0',
      height: '0',
      pointerEvents: 'none',
      overflow: 'visible',
    });
    document.body.appendChild(layer);
    setEl(layer);
    return () => {
      layer.remove();
      setEl(null);
    };
  }, []);

  // z-index and class stay in sync with the prop and configureFloaty without
  // recreating the layer (which would remount the portal).
  useIsomorphicLayoutEffect(() => {
    if (!el) return;
    styleLayer(el, floatyStore.getState().config, zIndex);
    return floatyStore.subscribe((state, prev) => {
      if (state.config !== prev.config) styleLayer(el, state.config, zIndex);
    });
  }, [el, zIndex]);

  return el;
}
