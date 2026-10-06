import { useState } from 'react';
import { floatyStore, type FloatyConfig } from './store';
import { useIsomorphicLayoutEffect } from './utils';

let layer: HTMLDivElement | null = null;
let users = 0;
let unsubscribe: (() => void) | null = null;

function styleLayer(el: HTMLDivElement, config: FloatyConfig) {
  el.className = config.layerClassName ?? '';
  el.style.zIndex = String(config.zIndex);
}

function acquireLayer(): HTMLDivElement {
  users++;
  if (!layer) {
    layer = document.createElement('div');
    layer.setAttribute('data-floaty-layer', '');
    Object.assign(layer.style, {
      position: 'fixed',
      inset: '0',
      pointerEvents: 'none',
      overflow: 'visible',
    });
    styleLayer(layer, floatyStore.getState().config);
    document.body.appendChild(layer);
    unsubscribe = floatyStore.subscribe((state, prev) => {
      if (layer && state.config !== prev.config) styleLayer(layer, state.config);
    });
  }
  return layer;
}

function releaseLayer() {
  users--;
  if (users > 0 || !layer) return;
  unsubscribe?.();
  unsubscribe = null;
  layer.remove();
  layer = null;
}

/**
 * Returns the shared overlay layer appended to `document.body`, creating it on
 * first use and removing it when the last user unmounts. `null` during SSR and
 * the first client render.
 */
export function useFloatyLayer(): HTMLDivElement | null {
  const [el, setEl] = useState<HTMLDivElement | null>(null);
  useIsomorphicLayoutEffect(() => {
    setEl(acquireLayer());
    return () => {
      releaseLayer();
      setEl(null);
    };
  }, []);
  return el;
}
