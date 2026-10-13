import { fireEvent, render, screen } from '@testing-library/react';
import { useLayoutEffect, useState } from 'react';
import { beforeEach, describe, expect, it } from 'vitest';
import { Floaty, FloatyAnchor, useFloaty, type FloatyProps } from '../src';
import { animations, endGracePeriod } from './setup';

const measured: Array<{ width: string; height: string }> = [];

/** Reads its box in a layout effect, like charts and maps that size themselves. */
function SelfMeasuring() {
  const [count, setCount] = useState(0);
  useLayoutEffect(() => {
    const { width, height } = document.querySelector<HTMLElement>('[data-floaty="f"]')!.style;
    measured.push({ width, height });
  }, []);
  return (
    <button type="button" onClick={() => setCount((c) => c + 1)}>
      count: {count}
    </button>
  );
}

function Holder() {
  useFloaty('f');
  return null;
}

function App({
  floaty = true,
  anchor,
  props,
}: {
  floaty?: boolean;
  anchor: boolean;
  props?: Partial<FloatyProps>;
}) {
  return (
    <>
      {floaty && (
        <Floaty floatyId="f" {...props}>
          <SelfMeasuring />
        </Floaty>
      )}
      {anchor && <FloatyAnchor floatyId="f" data-rect="10,20,300,200" />}
      <Holder />
    </>
  );
}

const box = () => document.querySelector<HTMLElement>('[data-floaty="f"]');
const button = () => screen.queryByRole('button', { hidden: true });
const afterAnchor = { keepMounted: 'afterAnchor' } as const;
const SIZE = { width: '300px', height: '200px' };

describe('first mount without an anchor', () => {
  beforeEach(() => {
    measured.length = 0;
  });

  it('mounts default content hidden and unsized before any anchor exists', () => {
    render(<App anchor={false} />);
    expect(box()?.dataset.floatyState).toBe('hidden');
    expect(measured).toEqual([{ width: '', height: '' }]);
  });

  it("keepMounted='afterAnchor' waits for the first anchor and mounts at its size", () => {
    const { rerender } = render(<App anchor={false} props={afterAnchor} />);
    expect(box()).toBeNull();
    expect(measured).toEqual([]);

    rerender(<App anchor props={afterAnchor} />);
    expect(measured).toEqual([SIZE]);
    expect(box()?.dataset.floatyState).toBe('visible');
    expect(box()?.style.transform).toBe('translate3d(10px, 20px, 0)');
    expect(animations).toHaveLength(0);
  });

  it("keepMounted='afterAnchor' keeps content mounted and sized once anchors go away", () => {
    const { rerender } = render(<App anchor props={afterAnchor} />);
    fireEvent.click(button()!);
    rerender(<App anchor={false} props={afterAnchor} />);
    endGracePeriod();
    expect(box()?.dataset.floatyState).toBe('hidden');
    expect(box()?.style.width).toBe('300px');
    expect(button()?.textContent).toBe('count: 1');
  });

  it('a Floaty mounted after the anchor left starts hidden at the last known size', () => {
    const { rerender } = render(<App anchor />);
    rerender(<App anchor={false} />);
    endGracePeriod();
    rerender(<App floaty={false} anchor={false} />);
    measured.length = 0;

    rerender(<App anchor={false} props={afterAnchor} />);
    expect(measured).toEqual([SIZE]);
    expect(box()?.dataset.floatyState).toBe('hidden');
    expect(box()?.style.width).toBe('300px');
    expect(box()?.style.height).toBe('200px');
  });

  it('keeps the rendered size in sync with positioning across switches and re-renders', () => {
    function Switch({ which, n }: { which: 'a' | 'b'; n: number }) {
      return (
        <>
          <Floaty floatyId="f" transition={false}>
            {() => <span>{n}</span>}
          </Floaty>
          {which === 'a' ? (
            <FloatyAnchor key="a" floatyId="f" data-rect="0,0,100,50" />
          ) : (
            <FloatyAnchor key="b" floatyId="f" data-rect="0,0,240,80" />
          )}
        </>
      );
    }
    const { rerender } = render(<Switch which="a" n={0} />);
    expect(box()?.style.width).toBe('100px');
    rerender(<Switch which="b" n={0} />);
    expect(box()?.style.width).toBe('240px');
    expect(box()?.style.height).toBe('80px');
    rerender(<Switch which="b" n={1} />);
    expect(box()?.style.width).toBe('240px');
  });
});
