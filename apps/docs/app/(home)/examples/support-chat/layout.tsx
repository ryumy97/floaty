import type { ReactNode } from 'react';
import { SupportChatShell } from '@/components/showcases/support-chat/shell';

export default function SupportChatLayout({ children }: { children: ReactNode }) {
  return (
    <div className="flex min-h-0 flex-1 flex-col">
      <SupportChatShell>{children}</SupportChatShell>
    </div>
  );
}
