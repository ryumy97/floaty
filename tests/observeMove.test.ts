import { afterEach, beforeEach, describe, expect, it, vi } from 'vitest';
import { observeMove } from '../src/observeMove';
import { FakeIntersectionObserver, intersectionObservers } from './setup';

const root = document.documentElement;

function element(rect: string) {
  const el = document.createElement('div');
  el.setAttribute('data-rect', rect);
  document.body.appendChild(el);
  return el;
}

const observers = () => [...intersectionObservers];
const latest = () => observers()[observers().length - 1];

describe('observeMove', () => {
  beforeEach(() => {
    Object.defineProperty(root, 'clientWidth', { value: 1000, configurable: true });
    Object.defineProperty(root, 'clientHeight', { value: 800, configurable: true });
  });
  afterEach(() => {
    vi.useRealTimers();
  });

  it('shrinks the root margin to the element rect and waits for full visibility', () => {
    observeMove(element('10.5,20,100,50'), vi.fn());
    expect(observers()).toHaveLength(1);
    expect(latest().options.rootMargin).toBe('-20px -889px -730px -10px');
    expect(latest().options.threshold).toBe(1);
    expect(latest().options.root).toBe(document);
  });

  it('does not report the initial callback when the element is fully visible', () => {
    const onMove = vi.fn();
    observeMove(element('0,0,10,10'), onMove);
    latest().fire(1);
    expect(onMove).not.toHaveBeenCalled();
  });

  it('reports a move when the ratio changes and re-arms around the new rect', () => {
    const onMove = vi.fn();
    const el = element('0,0,10,10');
    observeMove(el, onMove);
    const first = latest();
    first.fire(1);

    el.setAttribute('data-rect', '0,40,10,10');
    first.fire(0.2);
    expect(onMove).toHaveBeenCalledTimes(1);
    expect(intersectionObservers.has(first)).toBe(false);
    expect(observers()).toHaveLength(1);
    expect(latest().options.rootMargin).toBe('-40px -990px -750px 0px');
  });

  it('re-arms at the starting ratio for partially visible elements', () => {
    const onMove = vi.fn();
    observeMove(element('0,-5,10,10'), onMove);
    latest().fire(0.5);
    expect(onMove).toHaveBeenCalledTimes(1);
    expect(latest().options.threshold).toBe(0.5);
  });

  it('polls slowly while the element is entirely outside the viewport', () => {
    vi.useFakeTimers();
    const onMove = vi.fn();
    observeMove(element('0,2000,10,10'), onMove);
    latest().fire(0);
    expect(onMove).not.toHaveBeenCalled();
    vi.advanceTimersByTime(1000);
    expect(onMove).toHaveBeenCalledTimes(1);
    expect(latest().options.threshold).toBe(1e-7);
  });

  it('catches sub-pixel moves that keep the ratio at 1', () => {
    const onMove = vi.fn();
    const el = element('0,0,10,10');
    observeMove(el, onMove);
    latest().fire(1);
    el.setAttribute('data-rect', '0,0.5,10,10');
    latest().fire(1);
    expect(onMove).toHaveBeenCalledTimes(1);
  });

  it('skips zero-size elements and disconnects on cleanup', () => {
    observeMove(element('0,0,0,0'), vi.fn());
    expect(observers()).toHaveLength(0);

    const stop = observeMove(element('0,0,10,10'), vi.fn());
    expect(observers()).toHaveLength(1);
    stop();
    expect(observers()).toHaveLength(0);
  });

  it('is a no-op without IntersectionObserver', () => {
    vi.stubGlobal('IntersectionObserver', undefined);
    const stop = observeMove(element('0,0,10,10'), vi.fn());
    expect(() => stop()).not.toThrow();
    vi.stubGlobal('IntersectionObserver', FakeIntersectionObserver);
  });
});
