export interface FloatyRect {
  x: number;
  y: number;
  width: number;
  height: number;
}

export interface FloatyEasingTransition {
  type?: 'easing';
  /** Duration in milliseconds. */
  duration: number;
  /** Any CSS easing string (`ease-in-out`, `cubic-bezier(...)`, ...). */
  easing: string;
}

/** Spring defined by its physical constants. */
export interface FloatySpringPhysics {
  stiffness: number;
  damping: number;
  /** Defaults to `1`. */
  mass?: number;
  duration?: never;
  bounce?: never;
}

/** Spring defined by how it looks. */
export interface FloatySpringVisual {
  /** Perceptual duration in milliseconds (the spring's period). */
  duration: number;
  /**
   * `0` settles without overshoot, towards `1` bounces more, negative values
   * are overdamped. Range `(-1, 1)`. Defaults to `0`.
   */
  bounce?: number;
  stiffness?: never;
  damping?: never;
  mass?: never;
}

export type FloatySpringOptions = FloatySpringPhysics | FloatySpringVisual;

export type FloatySpringTransition = FloatySpringOptions & {
  type: 'spring';
  /**
   * Spring for width and height. `false` (default) uses the position spring
   * critically damped, so the size never overshoots.
   */
  bounceSize?: false | FloatySpringOptions;
};

export type FloatyTransitionConfig = FloatyEasingTransition | FloatySpringTransition;

/**
 * `false` snaps. Objects without `type: 'spring'` are easing transitions and
 * fill missing fields from the global easing default.
 */
export type FloatyTransition = false | Partial<FloatyEasingTransition> | FloatySpringTransition;

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
  /** `state` prop of the active anchor (kept after the anchor goes away). */
  state: unknown;
  reason: FloatyChangeReason;
  /** Increments whenever `anchor` or `rect` changes. */
  version: number;
  isAnimating: boolean;
}
