import { notFound } from 'next/navigation';
import { PhotoModal } from '../../../GalleryShell';
import { getPhoto } from '../../../photos';

export default async function InterceptedPhoto({ params }: { params: Promise<{ id: string }> }) {
  const { id } = await params;
  if (!getPhoto(id)) notFound();
  return <PhotoModal id={id} />;
}
