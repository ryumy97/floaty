import { fireEvent, render, screen } from '@testing-library/react';
import { useEffect, useState } from 'react';
import { describe, expect, it, vi } from 'vitest';
import { Floaty, FloatyAnchor, useFloaty, useFloatyState } from '../src';
import { animations } from './setup';

interface CounterState {
  variant: 'full' | 'compact';
  step?: number;
}

const effectRuns = vi.fn();

function Counter() {
  const state = useFloatyState<CounterState>();
  const [count, setCount] = useState(0);
  const step = state?.step ?? 1;
  useEffect(() => {
    effectRuns(state?.variant);
  }, [state?.variant]);
  return (
    <button type="button" data-variant={state?.variant ?? 'none'} onClick={() => setCount((c) => c + step)}>
      {state?.variant === 'compact' ? `${count}` : `count: ${count}`}
    </button>
  );
}

type Layout = 'full' | 'compact' | 'none';

function App({ layout, step }: { layout: Layout; step?: number }) {
  return (
    <>
      <Floaty floatyId="c" transition={false}>
        <Counter />
      </Floaty>
      {layout === 'full' && (
        <FloatyAnchor floatyId="c" data-rect="0,0,100,100" state={{ variant: 'full', step }} />
      )}
      {layout === 'compact' && (
        <FloatyAnchor floatyId="c" data-rect="0,0,40,40" state={{ variant: 'compact', step }} />
      )}
    </>
  );
}

const button = () => screen.getByRole('button');

describe('anchor state', () => {
  it('exposes the active anchor state to content via useFloatyState', () => {
    render(<App layout="full" />);
    expect(button().dataset.variant).toBe('full');
    expect(button().textContent).toBe('count: 0');
  });

  it('switches state with the anchor while keeping component state and running hooks', () => {
    effectRuns.mockClear();
    const { rerender } = render(<App layout="full" />);
    fireEvent.click(button());
    fireEvent.click(button());

    rerender(<App layout="compact" />);

    expect(button().dataset.variant).toBe('compact');
    expect(button().textContent).toBe('2');
    expect(effectRuns.mock.calls).toEqual([['full'], ['compact']]);
  });

  it('updates content when the active anchor state prop changes, without repositioning', () => {
    const { rerender } = render(<App layout="full" step={1} />);
    const item = document.querySelector<HTMLElement>('[data-floaty="c"]')!;
    const transformBefore = item.style.transform;

    rerender(<App layout="full" step={5} />);
    fireEvent.click(button());

    expect(button().textContent).toBe('count: 5');
    expect(item.style.transform).toBe(transformBefore);
    expect(animations).toHaveLength(0);
  });

  it('does not re-render content for shallow-equal inline state objects', () => {
    let renders = 0;
    function Probe() {
      useFloatyState();
      renders++;
      return null;
    }
    const probe = <Probe />;
    function Host({ tick }: { tick: number }) {
      return (
        <>
          <Floaty floatyId="p">{probe}</Floaty>
          <FloatyAnchor floatyId="p" data-tick={tick} state={{ variant: 'full' }} />
        </>
      );
    }
    const { rerender } = render(<Host tick={0} />);
    const after = renders;
    rerender(<Host tick={1} />);
    rerender(<Host tick={2} />);
    expect(renders).toBe(after);
  });

  it('ignores state changes on inactive anchors', () => {
    function Two({ bottomVariant }: { bottomVariant: CounterState['variant'] }) {
      return (
        <>
          <Floaty floatyId="t">
            <Counter />
          </Floaty>
          <FloatyAnchor floatyId="t" state={{ variant: bottomVariant }} />
          <FloatyAnchor floatyId="t" state={{ variant: 'full' }} />
        </>
      );
    }
    const { rerender } = render(<Two bottomVariant="full" />);
    rerender(<Two bottomVariant="compact" />);
    expect(button().dataset.variant).toBe('full');
  });

  it('keeps the last state while there is no anchor', () => {
    const { rerender } = render(<App layout="compact" />);
    rerender(<App layout="none" />);
    expect(screen.getByRole('button', { hidden: true }).dataset.variant).toBe('compact');
  });

  it('supports a render-function child with state and status', () => {
    function Host({ layout }: { layout: Layout }) {
      return (
        <>
          <Floaty<CounterState> floatyId="r" transition={false}>
            {(state, { hasAnchor }) => (
              <output data-testid="out">
                {state?.variant ?? 'none'}:{String(hasAnchor)}
              </output>
            )}
          </Floaty>
          {layout === 'full' && <FloatyAnchor floatyId="r" state={{ variant: 'full' }} />}
          {layout === 'compact' && <FloatyAnchor floatyId="r" state={{ variant: 'compact' }} />}
        </>
      );
    }
    const { rerender } = render(<Host layout="full" />);
    expect(screen.getByTestId('out').textContent).toBe('full:true');
    rerender(<Host layout="compact" />);
    expect(screen.getByTestId('out').textContent).toBe('compact:true');
    rerender(<Host layout="none" />);
    expect(screen.getByTestId('out').textContent).toBe('compact:false');
  });

  it('exposes state through useFloaty outside the content', () => {
    function Status() {
      const { state } = useFloaty<CounterState>('c');
      return <span data-testid="status">{state?.variant ?? 'none'}</span>;
    }
    const { rerender } = render(
      <>
        <App layout="full" />
        <Status />
      </>,
    );
    expect(screen.getByTestId('status').textContent).toBe('full');
    rerender(
      <>
        <App layout="compact" />
        <Status />
      </>,
    );
    expect(screen.getByTestId('status').textContent).toBe('compact');
  });

  it('throws when useFloatyState is used outside Floaty content', () => {
    const spy = vi.spyOn(console, 'error').mockImplementation(() => {});
    function Bad() {
      useFloatyState();
      return null;
    }
    expect(() => render(<Bad />)).toThrow(/inside <Floaty> content/);
    spy.mockRestore();
  });
});
