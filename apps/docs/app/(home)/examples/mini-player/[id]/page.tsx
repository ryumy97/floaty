import { notFound } from 'next/navigation';
import { getVideo, VIDEOS } from '@/components/showcases/mini-player/videos';
import { MiniPlayerWatch } from '@/components/showcases/mini-player/watch';

export function generateStaticParams() {
  return VIDEOS.map(({ id }) => ({ id }));
}

export async function generateMetadata({ params }: PageProps<'/examples/mini-player/[id]'>) {
  const { id } = await params;
  const video = getVideo(id);
  return { title: video ? video.title : 'Video' };
}

export default async function MiniPlayerWatchPage({
  params,
}: PageProps<'/examples/mini-player/[id]'>) {
  const { id } = await params;
  const video = getVideo(id);
  if (!video) notFound();
  return <MiniPlayerWatch video={video} />;
}
