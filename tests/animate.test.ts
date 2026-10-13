import { afterEach, describe, expect, it } from 'vitest';
import { easingFunction } from '../src/animate';
import { configureFloaty, floatyStore } from '../src/store';
import { endGracePeriod } from './setup';

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
    document.body.append(el);
    return el;
  };
  const snapshot = (floatyId: string) => floatyStore.getState().snapshots[floatyId];

  afterEach(() => {
    document.body.replaceChildren();
  });

  it('keeps the last rect after the anchor goes away', () => {
    const el = anchor('1,2,3,4');
    const unregister = floatyStore.getState().registerAnchor('a', el);
    unregister();
    expect(snapshot('a').anchor).toBe(el);
    endGracePeriod();
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

  it('switches directly to an anchor that registers within the grace period', () => {
    const first = anchor('1,2,3,4');
    const second = anchor('5,6,7,8');
    floatyStore.getState().registerAnchor('a', first)();
    const version = snapshot('a').version;

    floatyStore.getState().registerAnchor('a', second);
    expect(snapshot('a')).toMatchObject({ anchor: second, reason: 'anchor', version: version + 1 });
    endGracePeriod();
    expect(snapshot('a').anchor).toBe(second);
  });

  it('does not measure an unmounted anchor during the grace period', () => {
    const el = anchor('1,2,3,4');
    floatyStore.getState().registerAnchor('a', el)();
    el.remove();
    floatyStore.getState().measure('a');
    expect(snapshot('a').rect).toEqual({ x: 1, y: 2, width: 3, height: 4 });
  });

  it('falls back to a remaining anchor without a grace period', () => {
    const first = anchor('1,2,3,4');
    const second = anchor('5,6,7,8');
    floatyStore.getState().registerAnchor('a', first);
    floatyStore.getState().registerAnchor('a', second)();
    expect(snapshot('a').anchor).toBe(first);
  });

  describe('garbage collection', () => {
    const entries = () => {
      const { anchors, snapshots } = floatyStore.getState();
      return { anchors: Object.keys(anchors), snapshots: Object.keys(snapshots) };
    };
    const microtasks = () => Promise.resolve();

    it('drops an id once its last anchor is gone and nothing reads it', async () => {
      configureFloaty({ anchorGracePeriod: 0 });
      floatyStore.getState().registerAnchor('a', anchor('1,2,3,4'))();
      expect(entries().snapshots).toEqual(['a']);
      await microtasks();
      expect(entries()).toEqual({ anchors: [], snapshots: [] });
    });

    it('waits for the grace period', async () => {
      floatyStore.getState().registerAnchor('a', anchor('1,2,3,4'))();
      await microtasks();
      expect(entries().snapshots).toEqual(['a']);
      endGracePeriod();
      await microtasks();
      expect(entries()).toEqual({ anchors: [], snapshots: [] });
    });

    it('keeps the last rect and state while retained, then drops it on release', async () => {
      configureFloaty({ anchorGracePeriod: 0 });
      const release = floatyStore.getState().retain('a');
      floatyStore.getState().registerAnchor('a', anchor('1,2,3,4'), { mode: 'full' })();
      await microtasks();
      expect(snapshot('a')).toMatchObject({
        anchor: null,
        rect: { x: 1, y: 2, width: 3, height: 4 },
        state: { mode: 'full' },
      });

      release();
      release();
      await microtasks();
      expect(entries()).toEqual({ anchors: [], snapshots: [] });
    });

    it('counts several holders', async () => {
      configureFloaty({ anchorGracePeriod: 0 });
      const first = floatyStore.getState().retain('a');
      const second = floatyStore.getState().retain('a');
      floatyStore.getState().registerAnchor('a', anchor('1,2,3,4'))();
      first();
      await microtasks();
      expect(entries().snapshots).toEqual(['a']);
      second();
      await microtasks();
      expect(entries().snapshots).toEqual([]);
    });

    it('keeps an id whose anchor re-registers in the same task', async () => {
      configureFloaty({ anchorGracePeriod: 0 });
      const el = anchor('1,2,3,4');
      floatyStore.getState().registerAnchor('a', el)();
      floatyStore.getState().registerAnchor('a', el);
      await microtasks();
      expect(snapshot('a').anchor).toBe(el);
    });

    it('keeps ids that still have anchors', async () => {
      floatyStore.getState().registerAnchor('a', anchor('1,2,3,4'));
      floatyStore.getState().retain('a')();
      await microtasks();
      expect(entries()).toEqual({ anchors: ['a'], snapshots: ['a'] });
    });
  });

  it('releases immediately when anchorGracePeriod is 0', () => {
    configureFloaty({ anchorGracePeriod: 0 });
    floatyStore.getState().registerAnchor('a', anchor('1,2,3,4'))();
    expect(snapshot('a').anchor).toBeNull();
  });
});
