export interface FloatyRect {
  x: number;
  y: number;
  width: number;
  height: number;
}

export interface FloatyTransitionConfig {
  /** Duration in milliseconds. */
  duration: number;
  /** Any CSS easing string (`ease-in-out`, `cubic-bezier(...)`, ...). */
  easing: string;
}

export type FloatyTransition = false | Partial<FloatyTransitionConfig>;

/**
 * Why the anchor rect last changed.
 * - `anchor`: a different anchor became active (layout swapped)
 * - `layout`: the same anchor moved or resized (layout shifted)
 * - `scroll`: the viewport scrolled or resized
 */
export type FloatyChangeReason = 'anchor' | 'layout' | 'scroll';

export interface FloatySnapshot {
  /** The currently active anchor element, if any. */
  anchor: HTMLElement | null;
  /** Last known viewport rect of the active anchor (kept after the anchor goes away). */
  rect: FloatyRect | null;
  reason: FloatyChangeReason;
  /** Increments whenever `anchor` or `rect` changes. */
  version: number;
  isAnimating: boolean;
}
