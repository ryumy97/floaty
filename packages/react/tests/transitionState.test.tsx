import { act, render, renderHook, screen } from '@testing-library/react';
import { beforeEach, describe, expect, it } from 'vitest';
import { Floaty, FloatyAnchor, type FloatyProps, useFloatyTransition } from '../src';
import { animations, endGracePeriod, reducedMotion } from './setup';

type Mode = { mode: string };
type Layout = 'a' | 'b' | 'c' | 'none';
const RECTS: Record<Exclude<Layout, 'none'>, string> = {
  a: '0,0,100,50',
  b: '200,100,150,80',
  c: '50,300,120,60',
};

const renders: Array<{ state?: string; settled?: string; isAnimating: boolean }> = [];

function Content() {
  const { state, settledState, isAnimating } = useFloatyTransition<Mode>();
  renders.push({ state: state?.mode, settled: settledState?.mode, isAnimating });
  return <output data-testid="out">{settledState?.mode}</output>;
}

function App({
  layout,
  mode,
  props,
}: {
  layout: Layout;
  mode?: string;
  props?: Partial<FloatyProps>;
}) {
  return (
    <>
      <Floaty floatyId="m" transition={{ duration: 300, easing: 'linear' }} {...props}>
        <Content />
      </Floaty>
      {layout !== 'none' && (
        <FloatyAnchor
          key={layout}
          floatyId="m"
          data-rect={RECTS[layout]}
          state={{ mode: mode ?? layout }}
        />
      )}
    </>
  );
}

const settled = () => screen.getByTestId('out').textContent;
const last = () => renders[renders.length - 1];

describe('settledState', () => {
  beforeEach(() => {
    renders.length = 0;
  });

  it('keeps the previous state during the transition and switches on landing', () => {
    const { rerender } = render(<App layout="a" />);
    expect(settled()).toBe('a');

    const start = renders.length;
    rerender(<App layout="b" />);
    expect(animations).toHaveLength(1);
    expect(last()).toEqual({ state: 'b', settled: 'a', isAnimating: true });
    // No committed render ever showed the new form before landing.
    expect(renders.slice(start).every((r) => r.settled === 'a')).toBe(true);

    act(() => animations[0].finish());
    expect(last()).toEqual({ state: 'b', settled: 'b', isAnimating: false });
  });

  it('waits for the final landing when retargeted mid-flight', () => {
    const { rerender } = render(<App layout="a" />);
    rerender(<App layout="b" />);
    rerender(<App layout="c" />);
    expect(last()).toEqual({ state: 'c', settled: 'a', isAnimating: true });

    act(() => animations[1].finish());
    expect(settled()).toBe('c');
  });

  it('switches immediately when the move snaps', () => {
    const { rerender } = render(<App layout="a" props={{ transition: false }} />);
    rerender(<App layout="b" props={{ transition: false }} />);
    expect(last()).toEqual({ state: 'b', settled: 'b', isAnimating: false });
  });

  it('switches immediately with reduced motion', () => {
    const { rerender } = render(<App layout="a" />);
    reducedMotion.value = true;
    rerender(<App layout="b" />);
    expect(settled()).toBe('b');
  });

  it('follows state changes at rest, and applies changes during a transition on landing', () => {
    const { rerender } = render(<App layout="a" />);
    rerender(<App layout="a" mode="a2" />);
    expect(settled()).toBe('a2');

    rerender(<App layout="b" />);
    rerender(<App layout="b" mode="b2" />);
    expect(last()).toEqual({ state: 'b2', settled: 'a2', isAnimating: true });
    act(() => animations[0].finish());
    expect(settled()).toBe('b2');
  });

  it('settles when the anchor disappears mid-flight', () => {
    const { rerender } = render(<App layout="a" />);
    rerender(<App layout="b" />);
    rerender(<App layout="none" />);
    expect(settled()).toBe('a');
    endGracePeriod();
    expect(last()).toEqual({ state: 'b', settled: 'b', isAnimating: false });
  });

  it('passes settledState to render-function children', () => {
    const seen: Array<string | undefined> = [];
    function Host({ layout }: { layout: Layout }) {
      return (
        <>
          <Floaty<Mode> floatyId="r" transition={{ duration: 300 }}>
            {(state, { settledState }) => {
              seen.push(`${state?.mode}/${settledState?.mode}`);
              return null;
            }}
          </Floaty>
          {layout !== 'none' && (
            <FloatyAnchor
              key={layout}
              floatyId="r"
              data-rect={RECTS[layout]}
              state={{ mode: layout }}
            />
          )}
        </>
      );
    }
    const { rerender } = render(<Host layout="a" />);
    rerender(<Host layout="b" />);
    expect(seen[seen.length - 1]).toBe('b/a');
  });

  it('throws outside Floaty content', () => {
    expect(() => renderHook(() => useFloatyTransition())).toThrow(
      'useFloatyTransition() must be called inside <Floaty> content.',
    );
  });
});
