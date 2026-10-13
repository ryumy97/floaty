import type { ReactNode } from 'react';
import { HomesShell } from './HomesShell';
import '../example.css';
import './homes.css';

export const metadata = { title: 'Home search (Floaty example)' };

export default function HomesLayout({ children }: { children: ReactNode }) {
  return <HomesShell>{children}</HomesShell>;
}
