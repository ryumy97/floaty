import Link from 'next/link';
import { notFound } from 'next/navigation';
import { Suspense } from 'react';
import { TheaterToggle, Thumbnail, WatchLayout } from '../../TubeShell';
import { getVideo, VIDEOS, type Video } from '../../videos';

export default async function Watch({ params }: { params: Promise<{ id: string }> }) {
  const { id } = await params;
  const video = getVideo(id);
  if (!video) notFound();

  return (
    <WatchLayout
      details={
        <>
          <h1 className="tube-watch-title">{video.title}</h1>
          <div className="tube-watch-bar">
            <span className="tube-meta">
              {video.channel} · {video.views}
            </span>
            <TheaterToggle />
          </div>
          <p className="tube-description">{video.description}</p>
          <Suspense fallback={<p className="tube-meta">Loading comments...</p>}>
            <Comments video={video} />
          </Suspense>
        </>
      }
      upNext={
        <>
          <h2 className="tube-subtitle">Up next</h2>
          <ul className="tube-rows">
            {VIDEOS.filter((v) => v.id !== video.id).map((v) => (
              <li key={v.id}>
                <Link href={`/tube/watch/${v.id}`} className="tube-row">
                  <Thumbnail video={v} small />
                  <span>
                    <strong>{v.title}</strong>
                    <span className="tube-meta">{v.channel}</span>
                  </span>
                </Link>
              </li>
            ))}
          </ul>
        </>
      }
    />
  );
}

const AUTHORS = ['mira', 'tomasz', 'ana_k', 'joel', 'priya', 'sven'];

/** Streams in after the rest of the page, like data from a slower backend. */
async function Comments({ video }: { video: Video }) {
  await new Promise((resolve) => setTimeout(resolve, 600));
  const count = 3 + (video.hue % 3);
  return (
    <section className="tube-comments" aria-label="Comments">
      <h2 className="tube-subtitle">{count} comments</h2>
      {Array.from({ length: count }, (_, i) => (
        // biome-ignore lint/suspicious/noArrayIndexKey: generated comments are identified by their position
        <p key={i}>
          <strong>@{AUTHORS[(video.hue + i) % AUTHORS.length]}</strong>{' '}
          {COMMENTS[i % COMMENTS.length]}
        </p>
      ))}
    </section>
  );
}

const COMMENTS = [
  'Watched this on the bus and the mini player followed me through three other videos.',
  'The part at the end is worth the whole thing.',
  'Saving this for the weekend.',
  'Clear, calm and no filler. More of this please.',
  'I keep coming back to this one.',
];
