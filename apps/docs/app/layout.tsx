import { RootProvider } from 'fumadocs-ui/provider/next';
import './global.css';
import { Inter, JetBrains_Mono } from 'next/font/google';
import { Blob } from '@/components/blob';
import { FloatySearchDialog } from '@/components/floaty-search';

const inter = Inter({
  subsets: ['latin'],
});

const jetbrainsMono = JetBrains_Mono({
  subsets: ['latin'],
  variable: '--font-jetbrains-mono',
});

export default function Layout({ children }: LayoutProps<'/'>) {
  return (
    <html
      lang="en"
      className={`${inter.className} ${jetbrainsMono.variable}`}
      suppressHydrationWarning
    >
      <body className="flex flex-col min-h-screen">
        <RootProvider search={{ SearchDialog: FloatySearchDialog }}>
          {children}
          <Blob />
        </RootProvider>
      </body>
    </html>
  );
}
