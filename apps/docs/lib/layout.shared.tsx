import type { BaseLayoutProps } from 'fumadocs-ui/layouts/shared';
import { SearchBarSlot, SearchIconSlot } from '@/components/floaty-search';
import { appName, gitConfig } from './shared';

export function baseOptions(): BaseLayoutProps {
  return {
    nav: {
      // JSX supported
      title: appName,
    },
    githubUrl: `https://github.com/${gitConfig.user}/${gitConfig.repo}`,
    slots: { searchTrigger: { full: SearchBarSlot, sm: SearchIconSlot } },
  };
}
