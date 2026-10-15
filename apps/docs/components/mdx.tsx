import defaultMdxComponents from 'fumadocs-ui/mdx';
import type { MDXComponents } from 'mdx/types';
import AnchorState from './examples/anchor-state';
import { Preview } from './examples/preview';
import QuickStart from './examples/quick-start';
import SwitchOnLanding from './examples/switch-on-landing';
import { LayoutDemo } from './layout-demo';
import { TransitionPlayground } from './transition-playground';

export function getMDXComponents(components?: MDXComponents) {
  return {
    ...defaultMdxComponents,
    AnchorState,
    LayoutDemo,
    Preview,
    QuickStart,
    SwitchOnLanding,
    TransitionPlayground,
    ...components,
  } satisfies MDXComponents;
}

export const useMDXComponents = getMDXComponents;

declare global {
  type MDXProvidedComponents = ReturnType<typeof getMDXComponents>;
}
