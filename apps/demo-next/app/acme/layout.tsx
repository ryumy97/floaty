import type { ReactNode } from 'react';
import { ChatShell } from './ChatShell';
import '../example.css';
import './acme.css';

export const metadata = { title: 'Acme with a support chat (Floaty example)' };

export default function AcmeLayout({ children }: { children: ReactNode }) {
  return <ChatShell>{children}</ChatShell>;
}
