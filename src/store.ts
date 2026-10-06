import { createStore } from 'zustand/vanilla';
import { shallow } from 'zustand/vanilla/shallow';
import type {
  FloatyChangeReason,
  FloatyEasingTransition,
  FloatyRect,
  FloatySnapshot,
  FloatySpringTransition,
  FloatyTransition,
  FloatyTransitionConfig,
} from './types';

export const DEFAULT_TRANSITION: FloatyEasingTransition = {
  duration: 300,
  easing: 'ease-in-out',
};

/**
 * Resolves a `transition` value against a base config. Springs are used as
 * given; easing objects fill missing fields from the base, or from
 * `DEFAULT_TRANSITION` when the base is a spring.
 */
export function resolveTransition(
  transition: FloatyTransition | undefined,
  base: FloatyTransitionConfig,
): FloatyTransitionConfig | false {
  if (transition === false) return false;
  if (!transition) return base;
  if (transition.type === 'spring') return transition;
  const easing = base.type === 'spring' ? DEFAULT_TRANSITION : base;
  return {
    duration: transition.duration ?? easing.duration,
    easing: transition.easing ?? easing.easing,
  };
}

export interface FloatyConfig {
  /** z-index of the overlay layer. Defaults to 1000. */
  zIndex: number;
  /** Default transition for every `<Floaty>`. */
  transition: FloatyTransitionConfig;
  /** Class name applied to the overlay layer. */
  layerClassName?: string;
}

export const EMPTY_SNAPSHOT: FloatySnapshot = {
  anchor: null,
  rect: null,
  state: undefined,
  reason: 'anchor',
  version: 0,
  isAnimating: false,
};

const DEFAULT_CONFIG: FloatyConfig = { zIndex: 1000, transition: DEFAULT_TRANSITION };

interface FloatyState {
  config: FloatyConfig;
  /** Mounted anchors per floatyId; the last one is active. */
  anchors: Record<string, HTMLElement[]>;
  snapshots: Record<string, FloatySnapshot>;
  registerAnchor(floatyId: string, el: HTMLElement, anchorState?: unknown): () => void;
  /** Updates an anchor's state; reflected in the snapshot only while it is active. */
  setAnchorState(floatyId: string, el: HTMLElement, anchorState: unknown): void;
  /** Re-measures the active anchor. No-op if its rect did not change. */
  measure(floatyId: string, reason?: FloatyChangeReason): void;
  setAnimating(floatyId: string, isAnimating: boolean): void;
}

export function measureElement(el: Element): FloatyRect {
  const r = el.getBoundingClientRect();
  return { x: r.left, y: r.top, width: r.width, height: r.height };
}

export function rectsEqual(a: FloatyRect | null, b: FloatyRect | null): boolean {
  if (a === b) return true;
  if (!a || !b) return false;
  return a.x === b.x && a.y === b.y && a.width === b.width && a.height === b.height;
}

const anchorStates = new Map<HTMLElement, unknown>();

export const floatyStore = createStore<FloatyState>()((set, get) => {
  const snapshotOf = (floatyId: string) => get().snapshots[floatyId] ?? EMPTY_SNAPSHOT;

  const patchSnapshot = (
    floatyId: string,
    patch: Partial<FloatySnapshot>,
    anchors?: HTMLElement[],
  ) => {
    const prev = snapshotOf(floatyId);
    const bump = 'anchor' in patch || 'rect' in patch;
    set((state) => ({
      anchors: anchors ? { ...state.anchors, [floatyId]: anchors } : state.anchors,
      snapshots: {
        ...state.snapshots,
        [floatyId]: { ...prev, ...patch, version: bump ? prev.version + 1 : prev.version },
      },
    }));
  };

  const activate = (floatyId: string, anchors: HTMLElement[]) => {
    const prev = snapshotOf(floatyId);
    const anchor = anchors[anchors.length - 1] ?? null;
    if (anchor === prev.anchor) {
      set((state) => ({ anchors: { ...state.anchors, [floatyId]: anchors } }));
      return;
    }
    patchSnapshot(
      floatyId,
      {
        anchor,
        rect: anchor ? measureElement(anchor) : prev.rect,
        state: anchor ? anchorStates.get(anchor) : prev.state,
        reason: 'anchor',
      },
      anchors,
    );
  };

  return {
    config: DEFAULT_CONFIG,
    anchors: {},
    snapshots: {},

    registerAnchor(floatyId, el, anchorState) {
      anchorStates.set(el, anchorState);
      const current = get().anchors[floatyId] ?? [];
      activate(floatyId, [...current.filter((a) => a !== el), el]);
      return () => {
        const remaining = (get().anchors[floatyId] ?? []).filter((a) => a !== el);
        activate(floatyId, remaining);
        anchorStates.delete(el);
      };
    },

    setAnchorState(floatyId, el, anchorState) {
      if (!anchorStates.has(el) || shallow(anchorStates.get(el), anchorState)) return;
      anchorStates.set(el, anchorState);
      if (snapshotOf(floatyId).anchor === el) patchSnapshot(floatyId, { state: anchorState });
    },

    measure(floatyId, reason = 'layout') {
      const { anchor, rect } = snapshotOf(floatyId);
      if (!anchor) return;
      const next = measureElement(anchor);
      if (rectsEqual(rect, next)) return;
      patchSnapshot(floatyId, { rect: next, reason });
    },

    setAnimating(floatyId, isAnimating) {
      if (snapshotOf(floatyId).isAnimating === isAnimating) return;
      patchSnapshot(floatyId, { isAnimating });
    },
  };
});

export function selectSnapshot(floatyId: string) {
  return (state: FloatyState) => state.snapshots[floatyId] ?? EMPTY_SNAPSHOT;
}

/** Sets global options for every `<Floaty>` and the overlay layer. */
export function configureFloaty(
  options: Partial<Omit<FloatyConfig, 'transition'>> & {
    transition?: Partial<FloatyEasingTransition> | FloatySpringTransition;
  },
) {
  floatyStore.setState((state) => ({
    config: {
      ...state.config,
      ...options,
      transition:
        resolveTransition(options.transition, state.config.transition) ||
        state.config.transition,
    },
  }));
}

/** Restores the initial store state. Intended for tests. */
export function resetFloaty() {
  anchorStates.clear();
  floatyStore.setState({ config: DEFAULT_CONFIG, anchors: {}, snapshots: {} });
}
