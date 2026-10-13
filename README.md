# Floaty

Render content **on top of the screen** that follows layout placeholders, so it **keeps its
state** when the surrounding layout switches from one structure to another (grid to list,
page to sidebar, expanded to mini player, ...).

## Packages

| Package | Description |
| --- | --- |
| [`@floaty/react`](packages/react) | React components and hooks ([README](packages/react/README.md), [architecture](packages/react/ARCHITECTURE.md)) |

Vue and Svelte bindings are planned; they will share a framework-agnostic `@floaty/core`.

## Repository layout

```text
packages/
  react/         @floaty/react: the library, unit tests (Vitest + jsdom)
apps/
  demo-vite/     Playground on Vite              http://localhost:5199
  demo-next/     Playground on Next.js (App Router) http://localhost:5200
  docs/          Documentation site (Next.js + Fumadocs) http://localhost:5300
e2e/             Playwright specs, run against both demos
```

## Development

Requires Node.js 20+ and pnpm 10. Tasks run through [Turborepo](https://turborepo.com),
which builds workspace dependencies first and caches results.

```bash
pnpm install
pnpm dev          # Vite demo, with the library rebuilding on change
pnpm dev:next     # Next.js demo, with the library rebuilding on change
pnpm dev:docs     # docs site

pnpm test         # unit tests
pnpm test:e2e     # Playwright against both demos' production builds
                  # (first run: pnpm --filter @floaty/e2e exec playwright install chromium)
pnpm typecheck
pnpm build
```

See [AGENTS.md](AGENTS.md) for conventions.
