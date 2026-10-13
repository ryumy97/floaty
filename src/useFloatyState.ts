import { createContext, useContext } from 'react';

export interface FloatyContentContextValue {
  floatyId: string;
  state: unknown;
  settledState: unknown;
  isAnimating: boolean;
}

export const FloatyContentContext = createContext<FloatyContentContextValue | null>(null);

/** With `floatyId`, also requires the nearest `<Floaty>` to be that channel's. */
export function useContentContext(hook: string, floatyId?: string): FloatyContentContextValue {
  const ctx = useContext(FloatyContentContext);
  if (!ctx) {
    throw new Error(`${hook}() must be called inside <Floaty> content.`);
  }
  if (floatyId !== undefined && ctx.floatyId !== floatyId) {
    throw new Error(
      `${hook}() for "${floatyId}" was called inside the content of <Floaty floatyId="${ctx.floatyId}">.`,
    );
  }
  return ctx;
}

/**
 * Returns the `state` prop of the active `<FloatyAnchor>` for the enclosing
 * `<Floaty>`. While no anchor is mounted, returns the last active anchor's state.
 * Must be called inside `<Floaty>` content.
 */
export function useFloatyState<S = unknown>(): S | undefined {
  return useContentContext('useFloatyState').state as S | undefined;
}

export interface FloatyTransitionStatus<S = unknown> {
  /** The active anchor's state; switches as soon as the transition starts. */
  state: S | undefined;
  /** The state of the anchor the content rests on; switches once the content lands. */
  settledState: S | undefined;
  /** Whether the content is transitioning between positions. */
  isAnimating: boolean;
}

/**
 * Lets content choose when to change form during a transition: render from
 * `state` to switch at take-off, from `settledState` to switch on landing, or
 * use both with `isAnimating` for a custom blend. Must be called inside
 * `<Floaty>` content.
 */
export function useFloatyTransition<S = unknown>(): FloatyTransitionStatus<S> {
  const { state, settledState, isAnimating } = useContentContext('useFloatyTransition');
  return {
    state: state as S | undefined,
    settledState: settledState as S | undefined,
    isAnimating,
  };
}
