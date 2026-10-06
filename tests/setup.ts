import { cleanup } from '@testing-library/react';
import { afterEach, beforeEach, vi } from 'vitest';
import { resetFloaty } from '../src/store';

/**
 * jsdom has no layout. Elements report a rect from a `data-rect="x,y,w,h"`
 * attribute, or from their inline translate3d/width/height styles.
 */
function fakeRect(this: HTMLElement): DOMRect {
  let x = 0;
  let y = 0;
  let width = 0;
  let height = 0;
  const attr = this.getAttribute('data-rect');
  if (attr) {
    [x, y, width, height] = attr.split(',').map(Number);
  } else {
    const m = /translate3d\(([-\d.]+)px,\s*([-\d.]+)px/.exec(this.style.transform);
    if (m) {
      x = Number(m[1]);
      y = Number(m[2]);
    }
    width = parseFloat(this.style.width) || 0;
    height = parseFloat(this.style.height) || 0;
  }
  return {
    x,
    y,
    left: x,
    top: y,
    width,
    height,
    right: x + width,
    bottom: y + height,
    toJSON: () => ({}),
  } as DOMRect;
}

export interface FakeAnimation {
  keyframes: Keyframe[];
  options: KeyframeAnimationOptions;
  onfinish: (() => void) | null;
  cancel: ReturnType<typeof vi.fn>;
  currentTime: number;
  finish: () => void;
}

export const animations: FakeAnimation[] = [];
export const reducedMotion = { value: false };

class FakeResizeObserver {
  observe() {}
  unobserve() {}
  disconnect() {}
}

beforeEach(() => {
  resetFloaty();
  animations.length = 0;
  reducedMotion.value = false;
  HTMLElement.prototype.getBoundingClientRect = fakeRect;
  vi.stubGlobal('ResizeObserver', FakeResizeObserver);
  window.matchMedia = ((query: string) => ({
    matches: query.includes('reduce') && reducedMotion.value,
    media: query,
    onchange: null,
    addListener() {},
    removeListener() {},
    addEventListener() {},
    removeEventListener() {},
    dispatchEvent: () => false,
  })) as typeof window.matchMedia;
  HTMLElement.prototype.animate = vi.fn(function (
    keyframes: Keyframe[],
    options: KeyframeAnimationOptions,
  ) {
    const animation: FakeAnimation = {
      keyframes,
      options,
      onfinish: null,
      cancel: vi.fn(),
      currentTime: 0,
      finish: () => animation.onfinish?.(),
    };
    animations.push(animation);
    return animation as unknown as Animation;
  }) as unknown as HTMLElement['animate'];
});

afterEach(() => {
  cleanup();
  vi.unstubAllGlobals();
});
