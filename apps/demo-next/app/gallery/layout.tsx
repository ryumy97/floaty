import type { ReactNode } from 'react';
import { GalleryShell } from './GalleryShell';
import '../example.css';
import './gallery.css';

export const metadata = { title: 'Gallery (Floaty example)' };

/** `modal` is the `@modal` parallel route, filled by the intercepted `(.)photo/[id]`. */
export default function GalleryLayout({ children, modal }: { children: ReactNode; modal: ReactNode }) {
  return <GalleryShell modal={modal}>{children}</GalleryShell>;
}
