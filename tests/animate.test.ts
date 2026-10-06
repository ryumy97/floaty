import { describe, expect, it } from 'vitest';
import { easingFunction } from '../src/animate';
import { floatyStore } from '../src/store';

describe('easingFunction', () => {
  it('handles named easings and endpoints', () => {
    const linear = easingFunction('linear');
    expect(linear(0)).toBe(0);
    expect(linear(1)).toBe(1);
    expect(linear(0.5)).toBeCloseTo(0.5, 3);
    expect(easingFunction('ease-in')(0.5)).toBeLessThan(0.5);
    expect(easingFunction('ease-out')(0.5)).toBeGreaterThan(0.5);
  });

  it('parses cubic-bezier and falls back on invalid input', () => {
    expect(easingFunction('cubic-bezier(0, 0, 1, 1)')(0.3)).toBeCloseTo(0.3, 3);
    expect(easingFunction('nonsense')(0.5)).toBeCloseTo(easingFunction('ease-in-out')(0.5), 5);
  });
});

describe('floatyStore', () => {
  const anchor = (rect: string) => {
    const el = document.createElement('div');
    el.setAttribute('data-rect', rect);
    return el;
  };
  const snapshot = (floatyId: string) => floatyStore.getState().snapshots[floatyId];

  it('keeps the last rect after the anchor goes away', () => {
    const unregister = floatyStore.getState().registerAnchor('a', anchor('1,2,3,4'));
    unregister();
    expect(snapshot('a').anchor).toBeNull();
    expect(snapshot('a').rect).toEqual({ x: 1, y: 2, width: 3, height: 4 });
  });

  it('only updates when the measured rect changes', () => {
    const el = anchor('0,0,10,10');
    floatyStore.getState().registerAnchor('a', el);
    let calls = 0;
    const unsubscribe = floatyStore.subscribe(() => calls++);
    floatyStore.getState().measure('a');
    expect(calls).toBe(0);
    el.setAttribute('data-rect', '5,0,10,10');
    floatyStore.getState().measure('a', 'scroll');
    expect(calls).toBe(1);
    expect(snapshot('a').reason).toBe('scroll');
    unsubscribe();
  });
});
