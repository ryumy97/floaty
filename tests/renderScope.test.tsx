import { act, fireEvent, render, screen } from '@testing-library/react';
import { useState, type ReactNode } from 'react';
import { describe, expect, it } from 'vitest';
import { Floaty, FloatyAnchor, configureFloaty, useFloaty, useFloatyState } from '../src';
import { floatyStore } from '../src/store';
import { animations, flushFrames } from './setup';

const outer = () => document.querySelector<HTMLElement>('[data-floaty="r"]')!;
const anchor = () => screen.getByTestId('anchor');

/** Moves the anchor and lets the tracker re-measure it as a scroll. */
function scrollTo(y: number) {
  anchor().setAttribute('data-rect', `0,${y},10,10`);
  fireEvent.scroll(window);
  act(() => flushFrames());
}

describe('Floaty render scope', () => {
  it('follows scroll without re-rendering Floaty or its content', () => {
    let renderFunctionCalls = 0;
    let contentRenders = 0;
    function Content() {
      contentRenders++;
      useFloatyState();
      return null;
    }
    render(
      <>
        <Floaty floatyId="r">
          {() => {
            renderFunctionCalls++;
            return <Content />;
          }}
        </Floaty>
        <FloatyAnchor floatyId="r" data-testid="anchor" data-rect="0,0,10,10" />
      </>,
    );
    const before = { renderFunctionCalls, contentRenders };

    scrollTo(-40);
    scrollTo(-80);
    expect(outer().style.transform).toBe('translate3d(0px, -80px, 0)');
    expect({ renderFunctionCalls, contentRenders }).toEqual(before);
  });

  it('animates layout shifts without re-rendering for the rect', () => {
    let renders = 0;
    render(
      <>
        <Floaty floatyId="r">
          {(_, { isAnimating }) => {
            renders++;
            return String(isAnimating);
          }}
        </Floaty>
        <FloatyAnchor floatyId="r" data-testid="anchor" data-rect="0,0,10,10" />
      </>,
    );
    const before = renders;
    anchor().setAttribute('data-rect', '0,0,10,30');
    act(() => floatyStore.getState().measure('r', 'layout'));
    expect(animations).toHaveLength(1);
    expect(outer().textContent).toBe('true');
    // One render for isAnimating, none for the rect itself.
    expect(renders).toBe(before + 1);
  });
});

describe('Floaty anchor switches', () => {
  it('animates a same-commit swap even without a grace period', () => {
    configureFloaty({ anchorGracePeriod: 0 });
    function Swap({ second }: { second: boolean }) {
      return (
        <>
          <Floaty floatyId="r">content</Floaty>
          <FloatyAnchor key={String(second)} floatyId="r" data-rect={second ? '100,0,10,10' : '0,0,10,10'} />
        </>
      );
    }
    const { rerender } = render(<Swap second={false} />);
    rerender(<Swap second />);
    expect(animations).toHaveLength(1);
    expect(outer().dataset.floatyState).toBe('animating');
  });
});

describe('useFloaty render scope', () => {
  function App({ children }: { children: ReactNode }) {
    return (
      <>
        <Floaty floatyId="r">content</Floaty>
        <FloatyAnchor floatyId="r" data-testid="anchor" data-rect="0,0,10,10" />
        {children}
      </>
    );
  }

  it('re-renders only for the fields it reads', () => {
    let statusRenders = 0;
    let rectRenders = 0;
    function Status() {
      statusRenders++;
      const { hasAnchor, isAnimating } = useFloaty('r');
      return <output data-testid="status">{`${hasAnchor}:${isAnimating}`}</output>;
    }
    function Rect() {
      rectRenders++;
      const { rect } = useFloaty('r');
      return <output data-testid="rect">{rect?.y}</output>;
    }
    render(
      <App>
        <Status />
        <Rect />
      </App>,
    );
    const before = { statusRenders, rectRenders };

    scrollTo(-40);
    scrollTo(-80);
    expect(statusRenders).toBe(before.statusRenders);
    expect(rectRenders).toBe(before.rectRenders + 2);
    expect(screen.getByTestId('rect').textContent).toBe('-80');
  });

  it('returns fresh values for fields read for the first time', () => {
    function Status({ showRect }: { showRect: boolean }) {
      const status = useFloaty('r');
      return (
        <output data-testid="status">
          {status.hasAnchor ? (showRect ? String(status.rect?.y) : 'anchored') : 'none'}
        </output>
      );
    }
    function Host() {
      const [showRect, setShowRect] = useState(false);
      return (
        <App>
          <button onClick={() => setShowRect(true)}>show</button>
          <Status showRect={showRect} />
        </App>
      );
    }
    render(<Host />);
    scrollTo(-40);
    expect(screen.getByTestId('status').textContent).toBe('anchored');

    fireEvent.click(screen.getByRole('button'));
    expect(screen.getByTestId('status').textContent).toBe('-40');

    scrollTo(-60);
    expect(screen.getByTestId('status').textContent).toBe('-60');
  });
});