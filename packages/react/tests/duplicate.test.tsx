import { render } from '@testing-library/react';
import { StrictMode } from 'react';
import { afterEach, beforeEach, describe, expect, it, type MockInstance, vi } from 'vitest';
import { Floaty, FloatyAnchor } from '../src';
import { floatyStore } from '../src/store';

const contents = () =>
  [...document.querySelectorAll('[data-floaty="d"]')].map((el) => el.textContent);
const isAnimating = () => floatyStore.getState().snapshots.d?.isAnimating ?? false;

function App({
  first = true,
  second = true,
  x = 0,
}: {
  first?: boolean;
  second?: boolean;
  x?: number;
}) {
  return (
    <>
      {first && <Floaty floatyId="d">first</Floaty>}
      {second && <Floaty floatyId="d">second</Floaty>}
      <FloatyAnchor key={x} floatyId="d" data-rect={`${x},0,10,10`} />
    </>
  );
}

describe('duplicate Floaty per floatyId', () => {
  let warn: MockInstance;
  beforeEach(() => {
    warn = vi.spyOn(console, 'warn').mockImplementation(() => {});
  });
  afterEach(() => {
    warn.mockRestore();
  });

  it('renders only the first mounted Floaty and warns once', () => {
    const { rerender } = render(<App />);
    expect(contents()).toEqual(['first']);
    rerender(<App x={10} />);
    expect(warn).toHaveBeenCalledTimes(1);
    expect(warn.mock.calls[0][0]).toContain('floatyId="d"');
  });

  it('hands over to the next Floaty when the first unmounts', () => {
    const { rerender } = render(<App />);
    rerender(<App first={false} />);
    expect(contents()).toEqual(['second']);
    expect(document.querySelector<HTMLElement>('[data-floaty="d"]')!.dataset.floatyState).toBe(
      'visible',
    );
  });

  it('keeps isAnimating when a duplicate that is not animating unmounts', () => {
    const { rerender } = render(<App />);
    rerender(<App x={100} />);
    expect(isAnimating()).toBe(true);

    rerender(<App x={100} second={false} />);
    expect(isAnimating()).toBe(true);
  });

  it('does not warn for a single Floaty, remounts or StrictMode', () => {
    const { rerender } = render(
      <StrictMode>
        <App second={false} />
      </StrictMode>,
    );
    rerender(
      <StrictMode>
        <App first={false} />
      </StrictMode>,
    );
    expect(contents()).toEqual(['second']);
    expect(warn).not.toHaveBeenCalled();
  });
});
