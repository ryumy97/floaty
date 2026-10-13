import type { ReactNode } from 'react';
import { TubeShell } from './TubeShell';
import './tube.css';

export const metadata = { title: 'Floatube (Floaty example)' };

export default function TubeLayout({ children }: { children: ReactNode }) {
  return <TubeShell>{children}</TubeShell>;
}
