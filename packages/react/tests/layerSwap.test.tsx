import { act, render } from '@testing-library/react';
import { useSyncExternalStore } from 'react';
import { describe, expect, it, vi } from 'vitest';
import { Floaty, FloatyAnchor } from '../src';
import { animations } from './setup';

// A StrictMode effect replay during hydration can commit a render into the
// first layer and then move the portal into a recreated one, while Floaty
// stays mounted. jsdom's act() batches those commits, so the layer is driven
// directly here.
const current = { layer: null as HTMLDivElement | null, listeners: new Set<() => void>() };
const setLayer = (layer: HTMLDivElement) => {
  current.layer = layer;
  for (const listener of current.listeners) listener();
};
vi.mock('../src/layer', () => ({
  useFloatyLayer: () =>
    useSyncExternalStore(
      (listener) => {
        current.listeners.add(listener);
        return () => current.listeners.delete(listener);
      },
      () => current.layer,
    ),
}));

const makeLayer = () => {
  const layer = document.createElement('div');
  layer.style.position = 'absolute';
  document.body.appendChild(layer);
  return layer;
};

describe('layer swap', () => {
  it('positions the new outer element when the layer changes under a mounted Floaty', () => {
    const first = makeLayer();
    setLayer(first);
    render(
      <>
        <Floaty floatyId="swap" transition={{ duration: 300 }}>
          content
        </Floaty>
        <FloatyAnchor floatyId="swap" data-rect="40,60,100,50" />
      </>,
    );
    const outer = () => document.querySelector<HTMLElement>('[data-floaty="swap"]')!;
    expect(outer().parentElement).toBe(first);
    expect(outer().style.transform).toBe('translate3d(40px, 60px, 0)');

    const second = makeLayer();
    act(() => setLayer(second));
    first.remove();
    expect(outer().parentElement).toBe(second);
    expect(outer().style.transform).toBe('translate3d(40px, 60px, 0)');
    expect(outer().dataset.floatyState).toBe('visible');
    expect(animations).toHaveLength(0);
    second.remove();
  });
});
