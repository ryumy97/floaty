import { useEffect, useLayoutEffect } from 'react';

// Module-scoped so the build needs no Node types; consumers' bundlers replace
// `process.env.NODE_ENV`, and without a bundler `process` is undefined.
declare const process: { env: { NODE_ENV?: string } } | undefined;

export const useIsomorphicLayoutEffect =
  typeof window !== 'undefined' ? useLayoutEffect : useEffect;

/** Logs a warning outside production builds. */
export function warnDev(message: string) {
  if (typeof process !== 'undefined' && process.env.NODE_ENV !== 'production') {
    console.warn(`[@floaty/react] ${message}`);
  }
}
