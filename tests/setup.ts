import { act, cleanup } from '@testing-library/react';
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

/** Parses `deltaStyle` output back into numbers. */
export function parseDelta(keyframe: Keyframe) {
  const [, x, y] = /translate3d\(([-\d.]+)px, ([-\d.]+)px/.exec(String(keyframe.transform))!;
  const size = (value: unknown) => {
    const [, sign, px] = /calc\(100% ([+-]) ([\d.]+)px\)/.exec(String(value))!;
    return (sign === '-' ? -1 : 1) * Number(px);
  };
  return { x: Number(x), y: Number(y), width: size(keyframe.width), height: size(keyframe.height) };
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

const resizeObservers = new Set<FakeResizeObserver>();

class FakeResizeObserver {
  elements = new Set<Element>();
  constructor(private callback: ResizeObserverCallback) {}
  observe(el: Element) {
    this.elements.add(el);
    resizeObservers.add(this);
  }
  unobserve(el: Element) {
    this.elements.delete(el);
  }
  disconnect() {
    this.elements.clear();
    resizeObservers.delete(this);
  }
  notify() {
    this.callback([], this as unknown as ResizeObserver);
  }
}

/** Fires every ResizeObserver currently observing `el`. */
export function triggerResize(el: Element) {
  for (const observer of [...resizeObservers]) {
    if (observer.elements.has(el)) observer.notify();
  }
}

export const intersectionObservers = new Set<FakeIntersectionObserver>();

export class FakeIntersectionObserver {
  elements = new Set<Element>();
  constructor(
    private callback: IntersectionObserverCallback,
    public options: IntersectionObserverInit = {},
  ) {
    intersectionObservers.add(this);
  }
  observe(el: Element) {
    this.elements.add(el);
  }
  unobserve(el: Element) {
    this.elements.delete(el);
  }
  disconnect() {
    this.elements.clear();
    intersectionObservers.delete(this);
  }
  takeRecords() {
    return [];
  }
  fire(intersectionRatio: number) {
    const entry = { intersectionRatio } as IntersectionObserverEntry;
    this.callback([entry], this as unknown as IntersectionObserver);
  }
}

/** Fires every IntersectionObserver currently observing `el` with `ratio`. */
export function fireIntersection(el: Element, ratio: number) {
  for (const observer of [...intersectionObservers]) {
    if (observer.elements.has(el)) observer.fire(ratio);
  }
}

const frameCallbacks = new Map<number, FrameRequestCallback>();
let nextFrameId = 0;

/** Number of animation frame callbacks waiting to run. */
export const pendingFrames = () => frameCallbacks.size;

/** Runs the queued animation frame callbacks once (callbacks may queue more). */
export function flushFrames(time = performance.now()) {
  const callbacks = [...frameCallbacks.values()];
  frameCallbacks.clear();
  for (const callback of callbacks) callback(time);
}

/** Expires pending anchor grace periods (`anchorGracePeriod`). */
export function endGracePeriod() {
  act(() => {
    vi.runOnlyPendingTimers();
  });
}

beforeEach(() => {
  vi.useFakeTimers({ toFake: ['setTimeout', 'clearTimeout'] });
  resetFloaty();
  animations.length = 0;
  reducedMotion.value = false;
  resizeObservers.clear();
  intersectionObservers.clear();
  frameCallbacks.clear();
  HTMLElement.prototype.getBoundingClientRect = fakeRect;
  vi.stubGlobal('ResizeObserver', FakeResizeObserver);
  vi.stubGlobal('IntersectionObserver', FakeIntersectionObserver);
  vi.stubGlobal('requestAnimationFrame', (callback: FrameRequestCallback) => {
    frameCallbacks.set(++nextFrameId, callback);
    return nextFrameId;
  });
  vi.stubGlobal('cancelAnimationFrame', (id: number) => {
    frameCallbacks.delete(id);
  });
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
  vi.useRealTimers();
});
