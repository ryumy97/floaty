import type { ReactNode } from 'react';
import './styles.css';

export const metadata = { title: 'Floaty demo (Next.js)' };

export default function RootLayout({ children }: { children: ReactNode }) {
  return (
    <html lang="en">
      <body>{children}</body>
    </html>
  );
}
