import type { ReactNode } from 'react';

/** Frame for a live example whose source is shown above it with `<include>`. */
export function Preview({ children }: { children: ReactNode }) {
  return (
    <div className="example-preview not-prose my-6 rounded-xl border bg-fd-card p-4 text-sm">
      {children}
    </div>
  );
}
