import { forwardRef, type ReactElement, type Ref } from 'react';
import { Floaty, type FloatyProps } from './Floaty';
import { FloatyAnchor, type FloatyAnchorProps } from './FloatyAnchor';
import { type FloatyStatus, useFloaty } from './useFloaty';
import { type FloatyTransitionStatus, useContentContext } from './useFloatyState';

/** Components and hooks bound to one `floatyId` and one anchor state type. */
export interface FloatyChannel<S> {
  floatyId: string;
  Floaty: (props: Omit<FloatyProps<S>, 'floatyId'>) => ReactElement | null;
  FloatyAnchor: (
    props: Omit<FloatyAnchorProps<S>, 'floatyId'> & { ref?: Ref<HTMLDivElement> },
  ) => ReactElement | null;
  useFloaty: () => FloatyStatus<S>;
  /** Like `useFloatyState()`, but throws inside another channel's content. */
  useFloatyState: () => S | undefined;
  /** Like `useFloatyTransition()`, but throws inside another channel's content. */
  useFloatyTransition: () => FloatyTransitionStatus<S>;
}

/**
 * Binds the components and hooks to `floatyId` and types the anchor `state` as
 * `S`, so anchors, content and status readers can't disagree on either.
 * Call it once at module scope.
 */
export function createFloaty<S>(floatyId: string): FloatyChannel<S> {
  function BoundFloaty(props: Omit<FloatyProps<S>, 'floatyId'>) {
    return <Floaty<S> {...props} floatyId={floatyId} />;
  }
  BoundFloaty.displayName = `Floaty(${floatyId})`;

  const BoundAnchor = forwardRef<HTMLDivElement, Omit<FloatyAnchorProps<S>, 'floatyId'>>(
    (props, ref) => <FloatyAnchor<S> {...props} ref={ref} floatyId={floatyId} />,
  );
  BoundAnchor.displayName = `FloatyAnchor(${floatyId})`;

  return {
    floatyId,
    Floaty: BoundFloaty,
    FloatyAnchor: BoundAnchor as FloatyChannel<S>['FloatyAnchor'],
    useFloaty: () => useFloaty<S>(floatyId),
    useFloatyState: () => useContentContext('useFloatyState', floatyId).state as S | undefined,
    useFloatyTransition: () => {
      const { state, settledState, isAnimating } = useContentContext(
        'useFloatyTransition',
        floatyId,
      );
      return {
        state: state as S | undefined,
        settledState: settledState as S | undefined,
        isAnimating,
      };
    },
  };
}
