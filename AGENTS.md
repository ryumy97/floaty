# AGENTS.md

## Package manager

Use **pnpm** for everything. Do not use `npm` or `yarn`, and do not commit
`package-lock.json` or `yarn.lock`; `pnpm-lock.yaml` is the only lockfile.

This is a pnpm workspace orchestrated by Turborepo. Root scripts run `turbo`, which builds
workspace dependencies first (`^build`) and caches results.

| Task | Command |
| --- | --- |
| Install dependencies | `pnpm install` |
| Add a dependency to a package | `pnpm --filter <name> add <pkg>` (`-D` for dev) |
| Run a binary | `pnpm exec <bin>` (not `npx`) |
| Vite demo (+ library watch build), port 5199 | `pnpm dev` |
| Next.js demo (+ library watch build), port 5200 | `pnpm dev:next` |
| Docs site, port 5300 | `pnpm dev:docs` |
| Unit tests | `pnpm test` |
| E2E tests (builds and serves both demos) | `pnpm test:e2e` |
| Typecheck everything | `pnpm typecheck` |
| Build everything | `pnpm build` |
| One package only | `pnpm --filter @floaty/react test` (or `turbo run test --filter=...`) |

Shared versions (`react`, `typescript`, `vite`, `next`, ...) live in the `catalog:` of
`pnpm-workspace.yaml`; reference them with `"catalog:"` in package manifests.

## Before finishing a change

Run `pnpm typecheck`, `pnpm test`, and `pnpm build`; all must pass. When changing
positioning, animation or tracking in `packages/react/src/`, or the demos, also run
`pnpm test:e2e` (first time: `pnpm --filter @floaty/e2e exec playwright install chromium`).

## Project layout

- `packages/react/` (`@floaty/react`, published): the library. Read
  `packages/react/ARCHITECTURE.md` before changing `src/`, in particular the commit-phase
  timing invariant (section 9), and keep it up to date when the design changes.
  - `src/`: `Floaty`, `FloatyAnchor`, hooks, `createFloaty`, `configureFloaty`, backed by a
    global zustand store in `src/store.ts`.
  - `tests/`: Vitest + React Testing Library (jsdom). `tests/setup.ts` fakes layout via
    `data-rect` and mocks `element.animate`.
  - Keep `react`, `react-dom`, and `zustand` external and the `'use client'` banner in the
    build (`vite.config.ts`).
- `apps/demo-vite/`, `apps/demo-next/` (private): both import `@floaty/react` directly,
  through its built `dist/`, like a real app.
  - `apps/demo-vite/`: the one-page playground (`App.tsx`, `styles.css`), covered by
    `e2e/floaty.spec.ts`, which relies on its layouts and controls.
  - `apps/demo-next/` (App Router): the home page lists multi-page examples of client-side
    navigation: `tube/` (covered by `e2e/navigation.spec.ts`) and `gallery/`, `homes/`,
    `acme/`, `dashboard/`, `shop/` (covered by `e2e/examples.spec.ts`). They share
    `ExampleHeader.tsx` and `example.css`; floating content renders outside the page, so
    its CSS uses its own top-level classes.
- `apps/docs/` (private): documentation site (Next.js + Fumadocs). Pages are MDX in
  `content/docs/`; live examples are components in `components/`, registered in
  `components/mdx.tsx`. Update the docs when the public API changes.
- `e2e/` (private): Playwright specs, run as the `vite` and `next` projects, each matching
  its demo's specs (`e2e/playwright.config.ts`). Tests fail on page errors and `console.error`.

Future framework packages (`@floaty/vue`, `@floaty/svelte`) go in `packages/`, after the
framework-agnostic parts of `packages/react/src` move to a `@floaty/core` package.

<!-- BEGIN:turborepo-agent-rules -->

# This is NOT the Turborepo you know

Turborepo configuration, task behavior, and CLI commands can vary between installed versions and may differ from your training data. Resolve the `turbo` package from this file's directory or relevant workspace; in monorepos, it may not be visible from the repository root. For example, run `node -p "require.resolve('turbo/package.json')"` from a workspace that depends on `turbo`.

Read `docs/README.md` inside that installed package first, then read the relevant pages from its `docs/` directory before changing Turborepo configuration or commands. Heed deprecation notices. These bundled docs match the installed package version and are available without network access.

This block is written and re-added by `turbo` before repository-scoped commands when an AI agent is detected. In the Turborepo source repository, its template is defined in `crates/turborepo-cli/src/cli/agent_guidance.rs`. Removing the managed block while updates are enabled means a later qualifying invocation will add it again. Set `"agentGuidance": false` in the root `turbo.json` or `turbo.jsonc` to opt out; this does not remove an existing block. Keep the block committed with your work to avoid an uncommitted change on the next agent invocation.
<!-- END:turborepo-agent-rules -->
