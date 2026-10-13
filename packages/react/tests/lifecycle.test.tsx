import { act, render } from '@testing-library/react';
import { StrictMode, useEffect, useState } from 'react';
import { describe, expect, it, vi } from 'vitest';
import { Floaty, FloatyAnchor, type FloatyProps } from '../src';
import { createCurve, deltaStyle } from '../src/animate';
import { floatyStore } from '../src/store';
import type { FloatyRect } from '../src/types';
import { animations, endGracePeriod, parseDelta, reducedMotion } from './setup';

const RECTS = {
  a: { x: 0, y: 0, width: 100, height: 50 },
  b: { x: 200, y: 100, width: 150, height: 80 },
  c: { x: 50, y: 300, width: 120, height: 60 },
} satisfies Record<string, FloatyRect>;
type Layout = keyof typeof RECTS | 'none';

const rectAttr = ({ x, y, width, height }: FloatyRect) => `${x},${y},${width},${height}`;
const gap = (from: FloatyRect, to: FloatyRect): FloatyRect => ({
  x: from.x - to.x,
  y: from.y - to.y,
  width: from.width - to.width,
  height: from.height - to.height,
});
const add = (a: FloatyRect, b: FloatyRect): FloatyRect => ({
  x: a.x + b.x,
  y: a.y + b.y,
  width: a.width + b.width,
  height: a.height + b.height,
});

function App({
  layout,
  props,
  showFloaty = true,
}: {
  layout: Layout;
  props?: Partial<FloatyProps>;
  showFloaty?: boolean;
}) {
  return (
    <>
      {showFloaty && (
        <Floaty floatyId="l" {...props}>
          content
        </Floaty>
      )}
      {layout !== 'none' && <FloatyAnchor key={layout} floatyId="l" data-rect={rectAttr(RECTS[layout])} />}
    </>
  );
}

const outer = () => document.querySelector<HTMLElement>('[data-floaty="l"]')!;
const isAnimating = () => floatyStore.getState().snapshots.l?.isAnimating ?? false;
const easing = { duration: 500, easing: 'linear' };
const spring = { type: 'spring', duration: 400, bounce: 0.3 } as const;

describe('anchor switch mid-flight', () => {
  it('easing restarts from the current gap and keeps one transition', () => {
    const onTransitionStart = vi.fn();
    const onTransitionEnd = vi.fn();
    const props = { transition: easing, onTransitionStart, onTransitionEnd };
    const { rerender } = render(<App layout="a" props={props} />);
    rerender(<App layout="b" props={props} />);
    animations[0].currentTime = 250;
    rerender(<App layout="c" props={props} />);

    expect(animations[0].cancel).toHaveBeenCalled();
    expect(animations).toHaveLength(2);
    const halfway = createCurve(easing, gap(RECTS.a, RECTS.b)).at(250).delta;
    expect(animations[1].keyframes[0]).toEqual(deltaStyle(add(halfway, gap(RECTS.b, RECTS.c))));
    expect(animations[1].options).toEqual({ duration: 500, easing: 'linear' });
    expect(onTransitionStart).toHaveBeenCalledTimes(1);
    expect(onTransitionEnd).not.toHaveBeenCalled();

    act(() => animations[1].finish());
    expect(onTransitionEnd).toHaveBeenCalledTimes(1);
    expect(isAnimating()).toBe(false);
  });

  it('springs continue from the current gap with the carried velocity', () => {
    const props = { transition: spring };
    const { rerender } = render(<App layout="a" props={props} />);
    rerender(<App layout="b" props={props} />);
    animations[0].currentTime = 100;
    rerender(<App layout="c" props={props} />);

    const state = createCurve(spring, gap(RECTS.a, RECTS.b)).at(100);
    const startGap = add(state.delta, gap(RECTS.b, RECTS.c));
    const expected = createCurve(spring, startGap, state.velocity);
    const { keyframes, options } = animations[1];
    expect(keyframes[0]).toEqual(deltaStyle(startGap));
    expect(options.duration).toBeCloseTo(expected.duration);
    const step = expected.duration / (keyframes.length - 1);
    expect(keyframes[1]).toEqual(deltaStyle(expected.at(step).delta));
    expect(keyframes[1]).not.toEqual(
      deltaStyle(createCurve(spring, startGap).at(step).delta),
    );
  });
});

describe('interruptions', () => {
  it('cancels, hides and ends the transition when the anchor disappears mid-flight', () => {
    const onTransitionEnd = vi.fn();
    const props = { transition: easing, onTransitionEnd };
    const { rerender } = render(<App layout="a" props={props} />);
    rerender(<App layout="b" props={props} />);
    expect(isAnimating()).toBe(true);

    rerender(<App layout="none" props={props} />);
    expect(animations[0].cancel).not.toHaveBeenCalled();
    endGracePeriod();
    expect(animations[0].cancel).toHaveBeenCalled();
    expect(outer().dataset.floatyState).toBe('hidden');
    expect(isAnimating()).toBe(false);
    expect(onTransitionEnd).toHaveBeenCalledTimes(1);
  });

  it('ends the transition once when a retarget snaps (transition={false})', () => {
    const onTransitionEnd = vi.fn();
    const { rerender } = render(<App layout="a" props={{ transition: easing, onTransitionEnd }} />);
    rerender(<App layout="b" props={{ transition: easing, onTransitionEnd }} />);
    rerender(<App layout="c" props={{ transition: false, onTransitionEnd }} />);

    expect(animations).toHaveLength(1);
    expect(animations[0].cancel).toHaveBeenCalled();
    expect(onTransitionEnd).toHaveBeenCalledTimes(1);
    expect(outer().dataset.floatyState).toBe('visible');
    expect(outer().style.transform).toBe('translate3d(50px, 300px, 0)');
    expect(isAnimating()).toBe(false);
  });

  it('ends the transition once when a retarget snaps for reduced motion', () => {
    const onTransitionEnd = vi.fn();
    const props = { transition: easing, onTransitionEnd };
    const { rerender } = render(<App layout="a" props={props} />);
    rerender(<App layout="b" props={props} />);
    reducedMotion.value = true;
    rerender(<App layout="c" props={props} />);

    expect(animations).toHaveLength(1);
    expect(onTransitionEnd).toHaveBeenCalledTimes(1);
    expect(isAnimating()).toBe(false);
  });

  it('cancels the animation and clears isAnimating when Floaty unmounts mid-flight', () => {
    const { rerender } = render(<App layout="a" props={{ transition: easing }} />);
    rerender(<App layout="b" props={{ transition: easing }} />);
    expect(isAnimating()).toBe(true);

    rerender(<App layout="b" props={{ transition: easing }} showFloaty={false} />);
    expect(animations[0].cancel).toHaveBeenCalled();
    expect(isAnimating()).toBe(false);
  });
});

describe('StrictMode and multiple floaties', () => {
  it('keeps one layer, positions and animates under StrictMode', () => {
    const props = { transition: easing };
    const { rerender, unmount } = render(
      <StrictMode>
        <App layout="a" props={props} />
      </StrictMode>,
    );
    expect(document.querySelectorAll('[data-floaty-layer]')).toHaveLength(1);
    expect(outer().style.transform).toBe('translate3d(0px, 0px, 0)');

    rerender(
      <StrictMode>
        <App layout="b" props={props} />
      </StrictMode>,
    );
    expect(outer().style.transform).toBe('translate3d(200px, 100px, 0)');
    const last = animations[animations.length - 1];
    expect(last.keyframes[0]).toEqual(deltaStyle(gap(RECTS.a, RECTS.b)));

    unmount();
    expect(document.querySelector('[data-floaty-layer]')).toBeNull();
  });

  it('keeps the anchor stack correct under StrictMode', () => {
    function Multi({ second }: { second: boolean }) {
      return (
        <StrictMode>
          <Floaty floatyId="m" transition={false}>
            content
          </Floaty>
          <FloatyAnchor floatyId="m" data-rect="1,2,3,4" />
          {second && <FloatyAnchor floatyId="m" data-rect="5,6,7,8" />}
        </StrictMode>
      );
    }
    const get = () => document.querySelector<HTMLElement>('[data-floaty="m"]')!;
    const { rerender } = render(<Multi second={false} />);
    expect(get().style.transform).toBe('translate3d(1px, 2px, 0)');
    rerender(<Multi second />);
    expect(get().style.transform).toBe('translate3d(5px, 6px, 0)');
    rerender(<Multi second={false} />);
    expect(get().style.transform).toBe('translate3d(1px, 2px, 0)');
  });

  it('shares one ref-counted layer across several Floaty components', () => {
    function Two({ first, second }: { first: boolean; second: boolean }) {
      return (
        <>
          {first && <Floaty floatyId="one">one</Floaty>}
          {second && <Floaty floatyId="two">two</Floaty>}
        </>
      );
    }
    const layers = () => document.querySelectorAll('[data-floaty-layer]');
    const { rerender } = render(<Two first second />);
    expect(layers()).toHaveLength(1);
    expect(layers()[0].children).toHaveLength(2);

    rerender(<Two first={false} second />);
    expect(layers()).toHaveLength(1);
    expect(layers()[0].children).toHaveLength(1);

    rerender(<Two first={false} second={false} />);
    expect(layers()).toHaveLength(0);
  });
});

describe('bounceSize', () => {
  it('animates size with its own spring while position uses the main one', () => {
    const transition = {
      type: 'spring',
      duration: 400,
      bounce: 0,
      bounceSize: { duration: 400, bounce: 0.6 },
    } as const;
    const { rerender } = render(<App layout="a" props={{ transition }} />);
    rerender(<App layout="b" props={{ transition }} />);

    const deltas = animations[0].keyframes.map(parseDelta);
    expect(deltas[0]).toEqual(gap(RECTS.a, RECTS.b));
    expect(Math.max(...deltas.map((d) => d.width))).toBeGreaterThan(1);
    expect(Math.max(...deltas.map((d) => d.x))).toBeLessThanOrEqual(0);
  });
});

describe('anchor mounting in a later commit', () => {
  it('stays at the last anchor and animates into one that mounts within the grace period', () => {
    const onTransitionStart = vi.fn();
    const props = { transition: easing, onTransitionStart };
    const { rerender } = render(<App layout="a" props={props} />);
    rerender(<App layout="none" props={props} />);
    expect(outer().dataset.floatyState).toBe('visible');
    expect(outer().style.transform).toBe('translate3d(0px, 0px, 0)');

    rerender(<App layout="b" props={props} />);
    expect(animations).toHaveLength(1);
    expect(parseDelta(animations[0].keyframes[0])).toEqual(gap(RECTS.a, RECTS.b));
    expect(outer().dataset.floatyState).toBe('animating');
    expect(outer().style.transform).toBe('translate3d(200px, 100px, 0)');
    expect(onTransitionStart).toHaveBeenCalledTimes(1);

    endGracePeriod();
    expect(outer().dataset.floatyState).toBe('animating');
  });

  it('keeps a running transition and retargets it from the current gap', () => {
    const onTransitionEnd = vi.fn();
    const props = { transition: easing, onTransitionEnd };
    const { rerender } = render(<App layout="a" props={props} />);
    rerender(<App layout="b" props={props} />);
    animations[0].currentTime = 250;
    rerender(<App layout="none" props={props} />);
    expect(animations[0].cancel).not.toHaveBeenCalled();
    expect(isAnimating()).toBe(true);

    rerender(<App layout="c" props={props} />);
    const halfway = createCurve(easing, gap(RECTS.a, RECTS.b)).at(250).delta;
    expect(animations[0].cancel).toHaveBeenCalled();
    expect(animations[1].keyframes[0]).toEqual(deltaStyle(add(halfway, gap(RECTS.b, RECTS.c))));
    expect(onTransitionEnd).not.toHaveBeenCalled();
  });

  it('hides and snaps once the grace period has passed', () => {
    const props = { transition: easing };
    const { rerender } = render(<App layout="a" props={props} />);
    rerender(<App layout="none" props={props} />);
    endGracePeriod();
    expect(outer().dataset.floatyState).toBe('hidden');

    rerender(<App layout="b" props={props} />);
    expect(animations).toHaveLength(0);
    expect(outer().dataset.floatyState).toBe('visible');
    expect(outer().style.transform).toBe('translate3d(200px, 100px, 0)');
  });

  it('animates into an anchor gated on a later state update', () => {
    function Deferred() {
      const [ready, setReady] = useState(false);
      useEffect(() => {
        const id = setTimeout(() => setReady(true), 50);
        return () => clearTimeout(id);
      }, []);
      return ready ? <FloatyAnchor floatyId="l" data-rect={rectAttr(RECTS.b)} /> : null;
    }
    function Host({ routed }: { routed: boolean }) {
      return (
        <>
          <App layout={routed ? 'none' : 'a'} props={{ transition: easing }} />
          {routed && <Deferred />}
        </>
      );
    }
    const { rerender } = render(<Host routed={false} />);
    rerender(<Host routed />);
    expect(outer().dataset.floatyState).toBe('visible');
    act(() => {
      vi.advanceTimersByTime(50);
    });
    expect(animations).toHaveLength(1);
    expect(parseDelta(animations[0].keyframes[0])).toEqual(gap(RECTS.a, RECTS.b));
  });
});
