import type { ReactNode } from 'react';
import { MiniPlayerShell } from '@/components/showcases/mini-player/shell';

export default function MiniPlayerLayout({ children }: { children: ReactNode }) {
  return (
    <div className="flex min-h-0 flex-1 flex-col">
      <MiniPlayerShell>{children}</MiniPlayerShell>
    </div>
  );
}
