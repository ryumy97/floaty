import { createStore } from 'zustand/vanilla';
import type {
  FloatyChangeReason,
  FloatyRect,
  FloatySnapshot,
  FloatyTransitionConfig,
} from './types';

export const DEFAULT_TRANSITION: FloatyTransitionConfig = {
  duration: 300,
  easing: 'ease-in-out',
};

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
  registerAnchor(floatyId: string, el: HTMLElement): () => void;
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
      { anchor, rect: anchor ? measureElement(anchor) : prev.rect, reason: 'anchor' },
      anchors,
    );
  };

  return {
    config: DEFAULT_CONFIG,
    anchors: {},
    snapshots: {},

    registerAnchor(floatyId, el) {
      const current = get().anchors[floatyId] ?? [];
      activate(floatyId, [...current.filter((a) => a !== el), el]);
      return () => {
        const remaining = (get().anchors[floatyId] ?? []).filter((a) => a !== el);
        activate(floatyId, remaining);
      };
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
    transition?: Partial<FloatyTransitionConfig>;
  },
) {
  floatyStore.setState((state) => ({
    config: {
      ...state.config,
      ...options,
      transition: { ...state.config.transition, ...options.transition },
    },
  }));
}

/** Restores the initial store state. Intended for tests. */
export function resetFloaty() {
  floatyStore.setState({ config: DEFAULT_CONFIG, anchors: {}, snapshots: {} });
}
