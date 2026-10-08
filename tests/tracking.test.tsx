import { act, fireEvent, render, screen } from '@testing-library/react';
import { useImperativeHandle, type Ref } from 'react';
import { describe, expect, it } from 'vitest';
import { Floaty, FloatyAnchor, useFloaty } from '../src';
import { floatyStore } from '../src/store';
import { animations, flushFrames, pendingFrames, triggerResize } from './setup';

function App({ anchors = ['a'] }: { anchors?: string[] }) {
  return (
    <>
      <Floaty floatyId="t" transition={false}>
        content
      </Floaty>
      <div data-testid="scroller">
        {anchors.map((name) => (
          <FloatyAnchor key={name} floatyId="t" data-testid={`anchor-${name}`} data-rect="0,0,10,10" />
        ))}
      </div>
    </>
  );
}

const outer = () => document.querySelector<HTMLElement>('[data-floaty="t"]')!;
const snapshot = () => floatyStore.getState().snapshots.t;
const move = (name: string, rect: string) =>
  screen.getByTestId(`anchor-${name}`).setAttribute('data-rect', rect);
const flush = () => act(() => flushFrames());

describe('useRectTracker', () => {
  it('re-measures on window scroll in the next animation frame', () => {
    render(<App />);
    move('a', '0,-40,10,10');
    fireEvent.scroll(window);

    expect(outer().style.transform).toBe('translate3d(0px, 0px, 0)');
    flush();
    expect(outer().style.transform).toBe('translate3d(0px, -40px, 0)');
    expect(snapshot().reason).toBe('scroll');
  });

  it('catches scrolls of nested containers through the capture phase', () => {
    render(<App />);
    move('a', '0,-25,10,10');
    fireEvent.scroll(screen.getByTestId('scroller'));
    flush();
    expect(outer().style.transform).toBe('translate3d(0px, -25px, 0)');
  });

  it('reports window resize as scroll and anchor resize as layout', () => {
    render(<App />);
    move('a', '0,0,20,10');
    fireEvent(window, new Event('resize'));
    flush();
    expect(snapshot().reason).toBe('scroll');

    move('a', '0,0,30,10');
    triggerResize(screen.getByTestId('anchor-a'));
    flush();
    expect(snapshot().reason).toBe('layout');
    expect(outer().style.width).toBe('30px');
  });

  it('coalesces triggers into one frame and prefers layout over scroll', () => {
    render(<App />);
    move('a', '0,5,10,10');
    fireEvent.scroll(window);
    triggerResize(screen.getByTestId('anchor-a'));
    fireEvent.scroll(window);

    expect(pendingFrames()).toBe(1);
    flush();
    expect(snapshot().reason).toBe('layout');
    expect(pendingFrames()).toBe(0);
  });

  it('only tracks the active anchor', () => {
    render(<App anchors={['a', 'b']} />);
    triggerResize(screen.getByTestId('anchor-a'));
    expect(pendingFrames()).toBe(0);
    triggerResize(screen.getByTestId('anchor-b'));
    expect(pendingFrames()).toBe(1);
  });

  it('stops listening when there is no active anchor or on unmount', () => {
    const { rerender, unmount } = render(<App />);
    rerender(<App anchors={[]} />);
    fireEvent.scroll(window);
    expect(pendingFrames()).toBe(0);

    rerender(<App />);
    unmount();
    fireEvent.scroll(window);
    fireEvent(window, new Event('resize'));
    expect(pendingFrames()).toBe(0);
  });

  it('cancels a pending frame when the anchor deactivates', () => {
    const { rerender } = render(<App />);
    fireEvent.scroll(window);
    expect(pendingFrames()).toBe(1);
    rerender(<App anchors={[]} />);
    expect(pendingFrames()).toBe(0);
  });
});

describe('useFloaty().remeasure', () => {
  interface Handle {
    remeasure: () => void;
  }
  function Remeasure({ handle }: { handle: Ref<Handle> }) {
    const { remeasure } = useFloaty('r');
    useImperativeHandle(handle, () => ({ remeasure }), [remeasure]);
    return null;
  }

  it('re-measures the active anchor as a layout change', () => {
    const handle: { current: Handle | null } = { current: null };
    render(
      <>
        <Floaty floatyId="r" transition={{ duration: 200, easing: 'linear' }}>
          content
        </Floaty>
        <FloatyAnchor floatyId="r" data-testid="anchor-r" data-rect="0,0,10,10" />
        <Remeasure handle={handle} />
      </>,
    );
    screen.getByTestId('anchor-r').setAttribute('data-rect', '50,0,10,10');
    act(() => handle.current!.remeasure());

    expect(floatyStore.getState().snapshots.r.reason).toBe('layout');
    expect(document.querySelector<HTMLElement>('[data-floaty="r"]')!.style.transform).toBe(
      'translate3d(50px, 0px, 0)',
    );
    expect(animations).toHaveLength(1);
  });
});
