import { act, render, screen } from '@testing-library/react';
import { describe, expect, it } from 'vitest';
import { Floaty, FloatyAnchor } from '../src';
import { floatyStore } from '../src/store';
import { animations, parseDelta } from './setup';

const outer = () => document.querySelector<HTMLElement>('[data-floaty="c"]')!;
const layer = () => document.querySelector<HTMLElement>('[data-floaty-layer]')!;
/** Simulates the page being scrolled down by `y` px: the layer's origin moves up. */
const scrollPage = (y: number) => layer().setAttribute('data-rect', `0,${-y},0,0`);

function App({
  where,
  transition = false,
}: {
  where: 'page' | 'fixed' | 'sticky';
  transition?: boolean;
}) {
  return (
    <>
      <Floaty floatyId="c" transition={transition ? { duration: 300, easing: 'linear' } : false}>
        content
      </Floaty>
      {where === 'page' && (
        <FloatyAnchor floatyId="c" data-testid="anchor" data-rect="0,100,100,50" />
      )}
      {where === 'fixed' && (
        <div style={{ position: 'fixed' }}>
          <FloatyAnchor floatyId="c" data-testid="anchor" data-rect="0,0,100,50" />
        </div>
      )}
      {where === 'sticky' && (
        <div style={{ position: 'sticky', top: 0 }}>
          <FloatyAnchor floatyId="c" data-testid="anchor" data-rect="0,60,100,50" />
        </div>
      )}
    </>
  );
}

describe('coordinates', () => {
  it('uses an absolute layer at the document origin', () => {
    render(<App where="page" />);
    expect(layer().style.position).toBe('absolute');
    expect(layer().style.top).toBe('0px');
    expect(layer().style.left).toBe('0px');
  });

  it('places page anchors in document coordinates, so page scroll needs no update', () => {
    render(<App where="page" />);
    expect(outer().style.position).toBe('absolute');
    expect(outer().style.transform).toBe('translate3d(0px, 100px, 0)');

    scrollPage(300);
    screen.getByTestId('anchor').setAttribute('data-rect', '0,-200,100,50');
    act(() => floatyStore.getState().measure('c', 'scroll'));
    expect(outer().style.transform).toBe('translate3d(0px, 100px, 0)');
  });

  it('places anchors inside fixed containers in viewport coordinates', () => {
    render(<App where="fixed" />);
    scrollPage(300);
    act(() => floatyStore.getState().measure('c', 'layout'));
    expect(outer().style.position).toBe('fixed');
    expect(outer().style.transform).toBe('translate3d(0px, 0px, 0)');
  });

  it('keeps anchors inside a stuck sticky container on screen while the page scrolls', () => {
    render(<App where="sticky" />);
    expect(outer().style.position).toBe('fixed');
    expect(outer().style.transform).toBe('translate3d(0px, 60px, 0)');

    // Stuck: the page scrolls but the anchor's viewport rect stays the same.
    scrollPage(300);
    act(() => floatyStore.getState().measure('c', 'scroll'));
    expect(outer().style.position).toBe('fixed');
    expect(outer().style.transform).toBe('translate3d(0px, 60px, 0)');
  });

  it('follows a sticky container that is not stuck yet as the page scrolls', () => {
    render(<App where="sticky" />);
    scrollPage(40);
    screen.getByTestId('anchor').setAttribute('data-rect', '0,20,100,50');
    act(() => floatyStore.getState().measure('c', 'scroll'));
    expect(outer().style.transform).toBe('translate3d(0px, 20px, 0)');
  });

  it('animates the on-screen gap when switching between fixed and page anchors', () => {
    const { rerender } = render(<App where="fixed" transition />);
    scrollPage(300);
    rerender(<App where="page" transition />);

    expect(outer().style.position).toBe('absolute');
    expect(outer().style.transform).toBe('translate3d(0px, 400px, 0)');
    expect(parseDelta(animations[0].keyframes[0])).toEqual({ x: 0, y: -100, width: 0, height: 0 });

    rerender(<App where="fixed" transition />);
    expect(outer().style.position).toBe('fixed');
    expect(outer().style.transform).toBe('translate3d(0px, 0px, 0)');
  });
});
