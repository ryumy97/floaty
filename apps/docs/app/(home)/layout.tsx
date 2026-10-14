import { HomeLayout } from 'fumadocs-ui/layouts/home';
import { Blob } from '@/components/blob';
import { baseOptions } from '@/lib/layout.shared';

export default function Layout({ children }: LayoutProps<'/'>) {
  return (
    <HomeLayout {...baseOptions()}>
      {children}
      <Blob />
    </HomeLayout>
  );
}
