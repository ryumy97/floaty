import Link from 'next/link';
import { Thumbnail } from './TubeShell';
import { VIDEOS } from './videos';

export default function TubeHome() {
  return (
    <div className="tube-page">
      <h1 className="tube-title">Recommended</h1>
      <ul className="tube-grid">
        {VIDEOS.map((video) => (
          <li key={video.id}>
            <Link href={`/tube/watch/${video.id}`} className="tube-card">
              <Thumbnail video={video} />
              <strong>{video.title}</strong>
              <span className="tube-meta">
                {video.channel} · {video.views}
              </span>
            </Link>
          </li>
        ))}
      </ul>
    </div>
  );
}
