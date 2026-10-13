import { render, renderHook, screen } from '@testing-library/react';
import { createRef } from 'react';
import { describe, expect, it, vi } from 'vitest';
import { createFloaty, Floaty, FloatyAnchor } from '../src';

type Track = { title: string };
const player = createFloaty<Track>('player');
const other = createFloaty<{ n: number }>('other');

const outer = (id: string) => document.querySelector<HTMLElement>(`[data-floaty="${id}"]`)!;

function Title() {
  return <output data-testid="title">{player.useFloatyState()?.title}</output>;
}

describe('createFloaty', () => {
  it('binds the components and hooks to the id', () => {
    function Status() {
      const { hasAnchor, state } = player.useFloaty();
      return <span data-testid="status">{hasAnchor ? state?.title : 'none'}</span>;
    }
    render(
      <>
        <player.Floaty>
          <Title />
        </player.Floaty>
        <player.FloatyAnchor data-rect="10,20,100,50" state={{ title: 'Song' }} />
        <Status />
      </>,
    );
    expect(player.floatyId).toBe('player');
    expect(screen.getByTestId('title').textContent).toBe('Song');
    expect(screen.getByTestId('status').textContent).toBe('Song');
    expect(outer('player').style.width).toBe('100px');
    expect(document.querySelector('[data-floaty-anchor="player"]')).not.toBeNull();
  });

  it('interoperates with the unbound API on the same id', () => {
    render(
      <>
        <Floaty floatyId="player">
          <Title />
        </Floaty>
        <FloatyAnchor floatyId="player" data-rect="0,0,10,10" state={{ title: 'Plain' }} />
      </>,
    );
    expect(screen.getByTestId('title').textContent).toBe('Plain');
  });

  it('passes render-function children the typed state', () => {
    render(
      <>
        <player.Floaty>
          {(state, { settledState }) => (
            <span data-testid="out">
              {state?.title}/{settledState?.title}
            </span>
          )}
        </player.Floaty>
        <player.FloatyAnchor data-rect="0,0,10,10" state={{ title: 'T' }} />
      </>,
    );
    expect(screen.getByTestId('out').textContent).toBe('T/T');
  });

  it('forwards refs on the bound anchor', () => {
    const ref = createRef<HTMLDivElement>();
    render(<player.FloatyAnchor ref={ref} data-rect="0,0,10,10" />);
    expect(ref.current?.dataset.floatyAnchor).toBe('player');
  });

  it('exposes useFloatyTransition bound to the id', () => {
    function Content() {
      const { state, settledState, isAnimating } = player.useFloatyTransition();
      return (
        <span data-testid="out">
          {state?.title}/{settledState?.title}/{String(isAnimating)}
        </span>
      );
    }
    render(
      <>
        <player.Floaty>
          <Content />
        </player.Floaty>
        <player.FloatyAnchor data-rect="0,0,10,10" state={{ title: 'T' }} />
      </>,
    );
    expect(screen.getByTestId('out').textContent).toBe('T/T/false');
  });

  it("throws when a bound content hook runs inside another channel's content", () => {
    const error = vi.spyOn(console, 'error').mockImplementation(() => {});
    expect(() =>
      render(
        <other.Floaty>
          <Title />
        </other.Floaty>,
      ),
    ).toThrow('useFloatyState() for "player" was called inside the content of <Floaty floatyId="other">.');
    error.mockRestore();
  });

  it('throws when a bound content hook runs outside content', () => {
    const error = vi.spyOn(console, 'error').mockImplementation(() => {});
    expect(() => renderHook(() => player.useFloatyTransition())).toThrow(
      'useFloatyTransition() must be called inside <Floaty> content.',
    );
    error.mockRestore();
  });

  it('names the bound components after the id', () => {
    expect((player.Floaty as { displayName?: string }).displayName).toBe('Floaty(player)');
    expect((player.FloatyAnchor as { displayName?: string }).displayName).toBe(
      'FloatyAnchor(player)',
    );
  });

  it('types the anchor state and rejects floatyId (compile-time)', () => {
    const typeChecks = () => (
      <>
        {/* @ts-expect-error state must be a Track */}
        <player.FloatyAnchor state={{ n: 1 }} />
        {/* @ts-expect-error the id is bound */}
        <player.Floaty floatyId="x" />
        <player.Floaty>{(state) => state?.title}</player.Floaty>
      </>
    );
    const status = () => {
      const title: string | undefined = player.useFloaty().state?.title;
      // @ts-expect-error not a Track field
      return [title, player.useFloatyState()?.n];
    };
    expect(typeChecks).toBeTypeOf('function');
    expect(status).toBeTypeOf('function');
  });
});
