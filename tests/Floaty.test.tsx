import { act, fireEvent, render, screen } from '@testing-library/react';
import { useEffect, useState, type ReactNode } from 'react';
import { describe, expect, it, vi } from 'vitest';
import { Floaty, FloatyAnchor, configureFloaty, useFloaty, type FloatyProps } from '../src';
import { animations, reducedMotion } from './setup';

let mounts = 0;

function Counter() {
  const [count, setCount] = useState(0);
  useEffect(() => {
    mounts++;
  }, []);
  return (
    <button type="button" onClick={() => setCount((c) => c + 1)}>
      count: {count}
    </button>
  );
}

type Layout = 'a' | 'b' | 'none';

function App({
  layout,
  floatyProps,
  extra,
}: {
  layout: Layout;
  floatyProps?: Partial<FloatyProps>;
  extra?: ReactNode;
}) {
  return (
    <>
      <Floaty floatyId="item" {...floatyProps}>
        <Counter />
      </Floaty>
      {layout === 'a' && (
        <section data-testid="layout-a">
          <FloatyAnchor floatyId="item" data-testid="anchor-a" data-rect="10,20,100,50" />
        </section>
      )}
      {layout === 'b' && (
        <section data-testid="layout-b">
          <FloatyAnchor floatyId="item" data-testid="anchor-b" data-rect="300,400,200,120" />
        </section>
      )}
      {extra}
    </>
  );
}

const item = () => document.querySelector<HTMLElement>('[data-floaty="item"]')!;
const layer = () => document.querySelector<HTMLElement>('[data-floaty-layer]');

describe('Floaty', () => {
  it('renders content in a shared layer on document.body, not inside the anchor', () => {
    render(<App layout="a" />);
    expect(layer()!.parentElement).toBe(document.body);
    expect(layer()!.contains(screen.getByRole('button'))).toBe(true);
    expect(screen.getByTestId('anchor-a').contains(screen.getByRole('button'))).toBe(false);
  });

  it('removes the layer when the last Floaty unmounts', () => {
    const { unmount } = render(<App layout="a" />);
    expect(layer()).not.toBeNull();
    unmount();
    expect(layer()).toBeNull();
  });

  it('positions content over the active anchor', () => {
    render(<App layout="a" />);
    expect(item().style.transform).toBe('translate3d(10px, 20px, 0)');
    expect(item().style.width).toBe('100px');
    expect(item().style.height).toBe('50px');
    expect(item().dataset.floatyState).toBe('visible');
  });

  it('persists state across a layout swap without remounting', () => {
    mounts = 0;
    const { rerender } = render(<App layout="a" />);
    fireEvent.click(screen.getByRole('button'));
    fireEvent.click(screen.getByRole('button'));
    expect(screen.getByRole('button').textContent).toBe('count: 2');

    rerender(<App layout="b" />);

    expect(screen.queryByTestId('layout-a')).toBeNull();
    expect(screen.getByRole('button').textContent).toBe('count: 2');
    expect(mounts).toBe(1);
  });

  it('follows the new anchor rect after a swap', () => {
    const { rerender } = render(<App layout="a" floatyProps={{ transition: false }} />);
    rerender(<App layout="b" floatyProps={{ transition: false }} />);
    expect(item().style.transform).toBe('translate3d(300px, 400px, 0)');
    expect(item().style.width).toBe('200px');
    expect(item().style.height).toBe('120px');
  });

  it('snaps without animating when transition is false', () => {
    const { rerender } = render(<App layout="a" floatyProps={{ transition: false }} />);
    rerender(<App layout="b" floatyProps={{ transition: false }} />);
    expect(HTMLElement.prototype.animate).not.toHaveBeenCalled();
    expect(item().dataset.floatyState).toBe('visible');
  });

  it('snaps without animating when the user prefers reduced motion', () => {
    reducedMotion.value = true;
    const { rerender } = render(<App layout="a" />);
    rerender(<App layout="b" />);
    expect(HTMLElement.prototype.animate).not.toHaveBeenCalled();
    expect(item().style.transform).toBe('translate3d(300px, 400px, 0)');
  });

  it('animates from the old rect to the new rect and reports lifecycle', () => {
    const onTransitionStart = vi.fn();
    const onTransitionEnd = vi.fn();
    const props = {
      transition: { duration: 500, easing: 'linear' },
      onTransitionStart,
      onTransitionEnd,
    };
    const { rerender } = render(<App layout="a" floatyProps={props} />);
    expect(animations).toHaveLength(0);

    rerender(<App layout="b" floatyProps={props} />);

    expect(animations).toHaveLength(1);
    const [animation] = animations;
    expect(animation.options).toEqual({ duration: 500, easing: 'linear' });
    expect(animation.keyframes).toEqual([
      { transform: 'translate3d(10px, 20px, 0)', width: '100px', height: '50px' },
      { transform: 'translate3d(300px, 400px, 0)', width: '200px', height: '120px' },
    ]);
    expect(onTransitionStart).toHaveBeenCalledTimes(1);
    expect(onTransitionEnd).not.toHaveBeenCalled();
    expect(item().dataset.floatyState).toBe('animating');

    act(() => animation.finish());

    expect(onTransitionEnd).toHaveBeenCalledTimes(1);
    expect(item().dataset.floatyState).toBe('visible');
  });

  it('uses the global default transition from configureFloaty', () => {
    configureFloaty({ transition: { duration: 42, easing: 'ease-out' } });
    const { rerender } = render(<App layout="a" />);
    rerender(<App layout="b" />);
    expect(animations[0].options).toEqual({ duration: 42, easing: 'ease-out' });
  });

  it('applies zIndex and layerClassName from configureFloaty to the layer', () => {
    render(<App layout="a" />);
    expect(layer()!.style.zIndex).toBe('1000');
    act(() => configureFloaty({ zIndex: 7, layerClassName: 'my-layer' }));
    expect(layer()!.style.zIndex).toBe('7');
    expect(layer()!.className).toBe('my-layer');
  });

  it('hides but keeps content mounted when there is no anchor (keepMounted)', () => {
    const { rerender } = render(<App layout="a" />);
    fireEvent.click(screen.getByRole('button'));

    rerender(<App layout="none" />);
    expect(item().dataset.floatyState).toBe('hidden');
    expect(item().style.visibility).toBe('hidden');
    expect(item().getAttribute('aria-hidden')).toBe('true');

    rerender(<App layout="b" />);
    expect(screen.getByRole('button').textContent).toBe('count: 1');
    expect(item().dataset.floatyState).toBe('visible');
    expect(item().style.transform).toBe('translate3d(300px, 400px, 0)');
    expect(animations).toHaveLength(0);
  });

  it('unmounts content when there is no anchor and keepMounted is false', () => {
    const { rerender } = render(<App layout="a" floatyProps={{ keepMounted: false }} />);
    fireEvent.click(screen.getByRole('button'));

    rerender(<App layout="none" floatyProps={{ keepMounted: false }} />);
    expect(screen.queryByRole('button')).toBeNull();

    rerender(<App layout="a" floatyProps={{ keepMounted: false }} />);
    expect(screen.getByRole('button').textContent).toBe('count: 0');
  });

  it('uses the most recent anchor and falls back when it unmounts', () => {
    function Multi({ showSecond }: { showSecond: boolean }) {
      return (
        <>
          <Floaty floatyId="m" transition={false}>
            content
          </Floaty>
          <FloatyAnchor floatyId="m" data-rect="1,2,3,4" />
          {showSecond && <FloatyAnchor floatyId="m" data-rect="5,6,7,8" />}
        </>
      );
    }
    const get = () => document.querySelector<HTMLElement>('[data-floaty="m"]')!;
    const { rerender } = render(<Multi showSecond={false} />);
    expect(get().style.transform).toBe('translate3d(1px, 2px, 0)');

    rerender(<Multi showSecond />);
    expect(get().style.transform).toBe('translate3d(5px, 6px, 0)');

    rerender(<Multi showSecond={false} />);
    expect(get().style.transform).toBe('translate3d(1px, 2px, 0)');
  });

  it('animates when the same anchor shifts position', () => {
    function Shifting({ x }: { x: number }) {
      return (
        <>
          <Floaty floatyId="s">content</Floaty>
          <FloatyAnchor floatyId="s" data-rect={`${x},0,10,10`} />
        </>
      );
    }
    const { rerender } = render(<Shifting x={0} />);
    rerender(<Shifting x={80} />);
    expect(animations).toHaveLength(1);
    expect(animations[0].keyframes[1]).toMatchObject({ transform: 'translate3d(80px, 0px, 0)' });
  });

  it('does not animate layout shifts when animateLayoutChanges is false', () => {
    function Shifting({ x }: { x: number }) {
      return (
        <>
          <Floaty floatyId="s" animateLayoutChanges={false}>
            content
          </Floaty>
          <FloatyAnchor floatyId="s" data-rect={`${x},0,10,10`} />
        </>
      );
    }
    const { rerender } = render(<Shifting x={0} />);
    rerender(<Shifting x={80} />);
    expect(animations).toHaveLength(0);
    expect(document.querySelector<HTMLElement>('[data-floaty="s"]')!.style.transform).toBe(
      'translate3d(80px, 0px, 0)',
    );
  });
});

describe('FloatyAnchor', () => {
  it('passes the native id attribute through to the DOM', () => {
    render(<FloatyAnchor floatyId="x" id="dom-id" />);
    const el = document.getElementById('dom-id')!;
    expect(el).not.toBeNull();
    expect(el.getAttribute('data-floaty-anchor')).toBe('x');
  });
});

describe('useFloaty', () => {
  function Status() {
    const { hasAnchor, isAnimating, rect } = useFloaty('item');
    return (
      <output data-testid="status">
        {JSON.stringify({ hasAnchor, isAnimating, width: rect?.width ?? null })}
      </output>
    );
  }
  const status = () => JSON.parse(screen.getByTestId('status').textContent!);

  it('reports anchor presence, animation state and rect', () => {
    const { rerender } = render(<App layout="none" extra={<Status />} />);
    expect(status()).toEqual({ hasAnchor: false, isAnimating: false, width: null });

    rerender(<App layout="a" extra={<Status />} />);
    expect(status()).toEqual({ hasAnchor: true, isAnimating: false, width: 100 });

    rerender(<App layout="b" extra={<Status />} />);
    expect(status()).toEqual({ hasAnchor: true, isAnimating: true, width: 200 });

    act(() => animations[0].finish());
    expect(status()).toEqual({ hasAnchor: true, isAnimating: false, width: 200 });
  });
});
