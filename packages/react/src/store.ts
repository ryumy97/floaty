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
import { warnDev } from './utils';

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
  /** Default z-index for each floaty's overlay layer. Defaults to 1000. */
  zIndex: number;
  /** Default transition for every `<Floaty>`. */
  transition: FloatyTransitionConfig;
  /** Class name applied to every overlay layer. */
  layerClassName?: string;
  /**
   * How long (ms) the last anchor stays active after it unmounts, so an anchor that
   * mounts in a later commit still animates from it. `0` releases immediately.
   * Defaults to 150.
   */
  anchorGracePeriod: number;
}

export const EMPTY_SNAPSHOT: FloatySnapshot = {
  anchor: null,
  rect: null,
  state: undefined,
  reason: 'anchor',
  version: 0,
  isAnimating: false,
};

const DEFAULT_CONFIG: FloatyConfig = {
  zIndex: 1000,
  transition: DEFAULT_TRANSITION,
  anchorGracePeriod: 150,
};

interface FloatyState {
  config: FloatyConfig;
  /**
   * Mounted anchors per floatyId in registration order. The active one has the
   * highest `priority`; ties go to the last registered.
   */
  anchors: Record<string, HTMLElement[]>;
  snapshots: Record<string, FloatySnapshot>;
  /** Mounted `Floaty` instances per floatyId in mount order; the first one renders. */
  owners: Record<string, object[]>;
  registerAnchor(
    floatyId: string,
    el: HTMLElement,
    anchorState?: unknown,
    priority?: number,
  ): () => void;
  /** Changes an anchor's priority and re-picks the active anchor. */
  setAnchorPriority(floatyId: string, el: HTMLElement, priority: number): void;
  /** Updates an anchor's state; reflected in the snapshot only while it is active. */
  setAnchorState(floatyId: string, el: HTMLElement, anchorState: unknown): void;
  /** Re-measures the active anchor. No-op if its rect did not change. */
  measure(floatyId: string, reason?: FloatyChangeReason): void;
  setAnimating(floatyId: string, isAnimating: boolean): void;
  /**
   * Keeps `floatyId`'s entry alive while it has no anchors (used by `Floaty` and
   * `useFloaty`). Returns the release function.
   */
  retain(floatyId: string): () => void;
  /**
   * Registers a `Floaty` instance (`token`) for `floatyId`. Only the first
   * registered instance renders; returns the unregister function.
   */
  claimFloaty(floatyId: string, token: object): () => void;
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
const anchorPriorities = new Map<HTMLElement, number>();

/** Highest priority wins; ties go to the most recently registered anchor. */
function pickActive(anchors: HTMLElement[]): HTMLElement | null {
  let active: HTMLElement | null = null;
  let best = -Infinity;
  for (const anchor of anchors) {
    const priority = anchorPriorities.get(anchor) ?? 0;
    if (priority >= best) {
      best = priority;
      active = anchor;
    }
  }
  return active;
}
/** Grace timers for floatyIds whose last anchor unmounted. */
const releases = new Map<string, ReturnType<typeof setTimeout>>();
/** Number of mounted `Floaty`s and `useFloaty`s reading each floatyId. */
const holders = new Map<string, number>();
/** floatyIds already warned about duplicate `Floaty`s. */
const warnedDuplicates = new Set<string>();

function cancelRelease(floatyId: string) {
  clearTimeout(releases.get(floatyId));
  releases.delete(floatyId);
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

  const isUnused = (floatyId: string) =>
    !holders.has(floatyId) && !releases.has(floatyId) && !get().anchors[floatyId]?.length;

  // Deferred so a holder or anchor that unmounts and remounts within one commit
  // (StrictMode, key changes, layout swaps) keeps the entry.
  const collect = (floatyId: string) => {
    queueMicrotask(() => {
      const { anchors, snapshots } = get();
      if (!isUnused(floatyId) || !(floatyId in anchors || floatyId in snapshots)) return;
      const { [floatyId]: _anchors, ...restAnchors } = anchors;
      const { [floatyId]: _snapshot, ...restSnapshots } = snapshots;
      set({ anchors: restAnchors, snapshots: restSnapshots });
    });
  };

  const activate = (floatyId: string, anchors: HTMLElement[], graceful = false) => {
    cancelRelease(floatyId);
    const prev = snapshotOf(floatyId);
    const anchor = pickActive(anchors);
    const grace = get().config.anchorGracePeriod;
    if (!anchor && prev.anchor && graceful && grace > 0) {
      // Keep the unmounted anchor active so a replacement registering in a later
      // commit is still seen as a direct switch (section 9).
      set((state) => ({ anchors: { ...state.anchors, [floatyId]: anchors } }));
      releases.set(
        floatyId,
        setTimeout(() => {
          releases.delete(floatyId);
          activate(floatyId, get().anchors[floatyId] ?? []);
        }, grace),
      );
      return;
    }
    if (!anchor) collect(floatyId);
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
    owners: {},

    registerAnchor(floatyId, el, anchorState, priority = 0) {
      anchorStates.set(el, anchorState);
      anchorPriorities.set(el, priority);
      const current = get().anchors[floatyId] ?? [];
      activate(floatyId, [...current.filter((a) => a !== el), el]);
      return () => {
        const remaining = (get().anchors[floatyId] ?? []).filter((a) => a !== el);
        activate(floatyId, remaining, true);
        anchorStates.delete(el);
        anchorPriorities.delete(el);
      };
    },

    setAnchorPriority(floatyId, el, priority) {
      if (!anchorPriorities.has(el) || anchorPriorities.get(el) === priority) return;
      anchorPriorities.set(el, priority);
      activate(floatyId, get().anchors[floatyId] ?? []);
    },

    setAnchorState(floatyId, el, anchorState) {
      if (!anchorStates.has(el) || shallow(anchorStates.get(el), anchorState)) return;
      anchorStates.set(el, anchorState);
      if (snapshotOf(floatyId).anchor === el) patchSnapshot(floatyId, { state: anchorState });
    },

    measure(floatyId, reason = 'layout') {
      const { anchor, rect } = snapshotOf(floatyId);
      if (!anchor?.isConnected) return;
      const next = measureElement(anchor);
      if (rectsEqual(rect, next)) return;
      patchSnapshot(floatyId, { rect: next, reason });
    },

    setAnimating(floatyId, isAnimating) {
      if (snapshotOf(floatyId).isAnimating === isAnimating) return;
      patchSnapshot(floatyId, { isAnimating });
    },

    claimFloaty(floatyId, token) {
      const current = get().owners[floatyId] ?? [];
      if (current.length > 0 && !warnedDuplicates.has(floatyId)) {
        warnedDuplicates.add(floatyId);
        warnDev(
          `Several <Floaty floatyId="${floatyId}"> are mounted. Only the first one renders; ` +
            'the others render nothing until it unmounts. Render one <Floaty> per floatyId.',
        );
      }
      set((state) => ({ owners: { ...state.owners, [floatyId]: [...current, token] } }));
      return () => {
        set((state) => {
          const remaining = (state.owners[floatyId] ?? []).filter((t) => t !== token);
          const { [floatyId]: _removed, ...rest } = state.owners;
          return { owners: remaining.length ? { ...rest, [floatyId]: remaining } : rest };
        });
      };
    },

    retain(floatyId) {
      holders.set(floatyId, (holders.get(floatyId) ?? 0) + 1);
      let released = false;
      return () => {
        if (released) return;
        released = true;
        const count = (holders.get(floatyId) ?? 1) - 1;
        if (count > 0) {
          holders.set(floatyId, count);
          return;
        }
        holders.delete(floatyId);
        collect(floatyId);
      };
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
        resolveTransition(options.transition, state.config.transition) || state.config.transition,
    },
  }));
}

/** Restores the initial store state. Intended for tests. */
export function resetFloaty() {
  anchorStates.clear();
  anchorPriorities.clear();
  for (const floatyId of [...releases.keys()]) cancelRelease(floatyId);
  holders.clear();
  warnedDuplicates.clear();
  floatyStore.setState({ config: DEFAULT_CONFIG, anchors: {}, snapshots: {}, owners: {} });
}
