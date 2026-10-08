# AGENTS.md

## Package manager

Use **pnpm** for everything. Do not use `npm` or `yarn`, and do not commit
`package-lock.json` or `yarn.lock`; `pnpm-lock.yaml` is the only lockfile.

| Task | Command |
| --- | --- |
| Install dependencies | `pnpm install` |
| Add a dependency | `pnpm add <pkg>` |
| Add a dev dependency | `pnpm add -D <pkg>` |
| Remove a dependency | `pnpm remove <pkg>` |
| Run a binary | `pnpm exec <bin>` (not `npx`) |
| Demo playground | `pnpm dev` |
| Tests | `pnpm test` |
| E2E tests (Playwright, starts the demo) | `pnpm test:e2e` |
| Typecheck | `pnpm typecheck` |
| Library build | `pnpm build` |

## Before finishing a change

Run `pnpm typecheck`, `pnpm test`, and `pnpm build`; all must pass. When changing
positioning, animation or tracking in `src/`, also run `pnpm test:e2e` (first time:
`pnpm exec playwright install chromium`).

## Project layout

Read `docs/ARCHITECTURE.md` before changing `src/`, in particular the commit-phase timing
invariant (section 9), and keep it up to date when the design changes.

- `src/`: the library (`Floaty`, `FloatyAnchor`, `useFloaty`, `configureFloaty`), backed by a
  global zustand store in `src/store.ts`.
- `tests/`: Vitest + React Testing Library (jsdom). `tests/setup.ts` fakes layout via
  `data-rect` and mocks `element.animate`.
- `e2e/`: Playwright tests against the demo in Chromium (`playwright.config.ts` starts
  `pnpm dev` on port 5199). Tests rely on the demo's layouts and controls.
- `demo/`: Vite playground that imports the library source through the `floaty-component` alias.

Keep `react`, `react-dom`, and `zustand` external in the library build (`vite.config.ts`).
