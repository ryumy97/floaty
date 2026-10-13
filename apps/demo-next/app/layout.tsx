import type { ReactNode } from 'react';
import '@floaty/demo-app/styles.css';

export const metadata = { title: 'Floaty playground (Next.js)' };

export default function RootLayout({ children }: { children: ReactNode }) {
  return (
    <html lang="en">
      <body>{children}</body>
    </html>
  );
}
