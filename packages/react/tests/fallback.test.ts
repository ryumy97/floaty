import { afterEach, beforeEach, describe, expect, it, vi } from 'vitest';
import { createCurve, deltaStyle, playCurve } from '../src/animate';
import { flushFrames, pendingFrames } from './setup';

const clock = { now: 0 };

function element() {
  const el = document.createElement('div');
  Object.defineProperty(el, 'animate', { value: undefined });
  el.style.width = '100%';
  el.style.height = '100%';
  return el;
}

const curve = () =>
  createCurve({ duration: 100, easing: 'linear' }, { x: -100, y: 0, width: -50, height: 0 });

describe('requestAnimationFrame fallback', () => {
  beforeEach(() => {
    clock.now = 0;
    vi.spyOn(performance, 'now').mockImplementation(() => clock.now);
  });
  afterEach(() => {
    vi.restoreAllMocks();
  });

  const advance = (ms: number) => {
    clock.now += ms;
    flushFrames(clock.now);
  };

  it('writes the gap each frame and restores resting styles on finish', () => {
    const el = element();
    const onFinish = vi.fn();
    const motion = playCurve(el, curve(), onFinish);

    expect(el.style.transform).toBe(deltaStyle({ x: -100, y: 0, width: -50, height: 0 }).transform);
    advance(50);
    expect(el.style.transform).toBe('translate3d(-50px, 0px, 0)');
    expect(el.style.width).toBe('calc(100% - 25px)');
    expect(motion.current().delta.x).toBeCloseTo(-50);

    advance(50);
    expect(onFinish).toHaveBeenCalledTimes(1);
    expect(el.style.transform).toBe('');
    expect(el.style.width).toBe('100%');
    expect(el.style.height).toBe('100%');
    expect(pendingFrames()).toBe(0);
  });

  it('restores resting styles on cancel and never calls onFinish', () => {
    const el = element();
    const onFinish = vi.fn();
    const motion = playCurve(el, curve(), onFinish);
    advance(30);

    motion.cancel();
    expect(el.style.transform).toBe('');
    expect(el.style.width).toBe('100%');
    expect(pendingFrames()).toBe(0);

    advance(200);
    expect(onFinish).not.toHaveBeenCalled();
  });

  it('plays springs frame by frame too', () => {
    const el = element();
    const onFinish = vi.fn();
    const spring = createCurve(
      { type: 'spring', duration: 300 },
      { x: -100, y: 0, width: 0, height: 0 },
    );
    playCurve(el, spring, onFinish);
    advance(60);
    expect(el.style.transform).toBe(deltaStyle(spring.at(60).delta).transform);

    while (pendingFrames() > 0) advance(16);
    expect(onFinish).toHaveBeenCalledTimes(1);
    expect(el.style.transform).toBe('');
  });
});
