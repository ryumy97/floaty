import { DocsLayout } from 'fumadocs-ui/layouts/docs';
import { BlobSidebarItem } from '@/components/blob-sidebar-item';
import { baseOptions } from '@/lib/layout.shared';
import { source } from '@/lib/source';

export default function Layout({ children }: LayoutProps<'/docs'>) {
  return (
    <DocsLayout
      tree={source.getPageTree()}
      {...baseOptions()}
      sidebar={{ components: { Item: BlobSidebarItem } }}
    >
      {children}
    </DocsLayout>
  );
}
