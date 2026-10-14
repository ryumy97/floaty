import { render } from '@testing-library/react';
import { describe, expect, it } from 'vitest';
import { Floaty, FloatyAnchor } from '../src';
import { animations } from './setup';

interface AnchorSpec {
  name: string;
  priority?: number;
  floatyId?: string;
}

const X: Record<string, number> = { a: 10, b: 20, c: 30, d: 40 };

function App({ anchors, transition = false }: { anchors: AnchorSpec[]; transition?: boolean }) {
  return (
    <>
      <Floaty floatyId="o" transition={transition ? { duration: 300 } : false}>
        content
      </Floaty>
      {anchors.map(({ name, priority, floatyId = 'o' }) => (
        <FloatyAnchor
          key={name}
          floatyId={floatyId}
          priority={priority}
          data-rect={`${X[name]},0,10,10`}
        />
      ))}
    </>
  );
}

/** Name of the anchor the content currently sits on. */
function active() {
  const transform = document.querySelector<HTMLElement>('[data-floaty="o"]')!.style.transform;
  const x = Number(/translate3d\(([-\d.]+)px/.exec(transform)?.[1]);
  return Object.keys(X).find((name) => X[name] === x);
}

describe('anchor order without priority', () => {
  it('activates the most recently mounted anchor and falls back on unmount', () => {
    const { rerender } = render(<App anchors={[{ name: 'a' }]} />);
    rerender(<App anchors={[{ name: 'a' }, { name: 'b' }]} />);
    expect(active()).toBe('b');
    rerender(<App anchors={[{ name: 'a' }]} />);
    expect(active()).toBe('a');
  });

  it('resolves anchors mounted in the same commit by tree order: the later sibling wins', () => {
    render(<App anchors={[{ name: 'a' }, { name: 'b' }]} />);
    expect(active()).toBe('b');
  });

  it('lets a parent anchor win over an anchor nested inside it', () => {
    render(
      <>
        <Floaty floatyId="o" transition={false}>
          content
        </Floaty>
        <FloatyAnchor floatyId="o" data-rect="10,0,10,10">
          <FloatyAnchor floatyId="o" data-rect="20,0,10,10" />
        </FloatyAnchor>
      </>,
    );
    expect(active()).toBe('a');
  });

  it('moves a re-registered anchor to the top (floatyId change)', () => {
    const { rerender } = render(<App anchors={[{ name: 'a' }, { name: 'b' }]} />);
    rerender(<App anchors={[{ name: 'a', floatyId: 'other' }, { name: 'b' }]} />);
    rerender(<App anchors={[{ name: 'a' }, { name: 'b' }]} />);
    expect(active()).toBe('a');
  });
});

describe('anchor priority', () => {
  it('keeps a higher-priority anchor active when a lower one mounts later', () => {
    const { rerender } = render(<App anchors={[{ name: 'a', priority: 1 }]} transition />);
    rerender(<App anchors={[{ name: 'a', priority: 1 }, { name: 'b' }]} transition />);
    expect(active()).toBe('a');
    expect(animations).toHaveLength(0);
  });

  it('decides same-commit mounts by priority instead of tree order', () => {
    render(<App anchors={[{ name: 'a', priority: 1 }, { name: 'b' }]} />);
    expect(active()).toBe('a');
  });

  it('breaks ties by mount order', () => {
    const { rerender } = render(<App anchors={[{ name: 'a', priority: 1 }]} />);
    rerender(
      <App
        anchors={[
          { name: 'a', priority: 1 },
          { name: 'b', priority: 1 },
        ]}
      />,
    );
    expect(active()).toBe('b');
  });

  it('falls back to the highest remaining priority, not the most recent', () => {
    const { rerender } = render(
      <App
        anchors={[
          { name: 'a', priority: 2 },
          { name: 'c', priority: 1 },
        ]}
      />,
    );
    rerender(
      <App anchors={[{ name: 'a', priority: 2 }, { name: 'c', priority: 1 }, { name: 'b' }]} />,
    );
    expect(active()).toBe('a');
    rerender(<App anchors={[{ name: 'c', priority: 1 }, { name: 'b' }]} />);
    expect(active()).toBe('c');
  });

  it('re-picks and animates when a priority changes', () => {
    const { rerender } = render(<App anchors={[{ name: 'a' }, { name: 'b' }]} transition />);
    expect(active()).toBe('b');
    rerender(<App anchors={[{ name: 'a', priority: 1 }, { name: 'b' }]} transition />);
    expect(active()).toBe('a');
    expect(animations).toHaveLength(1);
  });

  it('keeps a re-registered lower-priority anchor from taking over', () => {
    const { rerender } = render(<App anchors={[{ name: 'a', priority: 1 }, { name: 'b' }]} />);
    rerender(
      <App
        anchors={[
          { name: 'a', priority: 1 },
          { name: 'b', floatyId: 'other' },
        ]}
      />,
    );
    rerender(<App anchors={[{ name: 'a', priority: 1 }, { name: 'b' }]} />);
    expect(active()).toBe('a');
  });
});
