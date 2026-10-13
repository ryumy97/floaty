import type { ReactNode } from 'react';
import { DashboardShell } from './DashboardShell';
import '../example.css';
import './dashboard.css';

export const metadata = { title: 'Dashboard (Floaty example)' };

export default function DashboardLayout({ children }: { children: ReactNode }) {
  return <DashboardShell>{children}</DashboardShell>;
}
