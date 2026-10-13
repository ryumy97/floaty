import { WatchLayout } from '../../TubeShell';

/** Includes the player's anchor, so the player is already in place while the page loads. */
export default function WatchLoading() {
  return (
    <WatchLayout
      details={
        <>
          <div className="tube-skeleton title" />
          <div className="tube-skeleton line" />
        </>
      }
      upNext={<div className="tube-skeleton block" />}
    />
  );
}
