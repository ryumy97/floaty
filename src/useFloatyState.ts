import { createContext, useContext } from 'react';

export interface FloatyContentContextValue {
  floatyId: string;
  state: unknown;
}

export const FloatyContentContext = createContext<FloatyContentContextValue | null>(null);

/**
 * Returns the `state` prop of the active `<FloatyAnchor>` for the enclosing
 * `<Floaty>`. While no anchor is mounted, returns the last active anchor's state.
 * Must be called inside `<Floaty>` content.
 */
export function useFloatyState<S = unknown>(): S | undefined {
  const ctx = useContext(FloatyContentContext);
  if (!ctx) {
    throw new Error('useFloatyState() must be called inside <Floaty> content.');
  }
  return ctx.state as S | undefined;
}
