# TODO

Findings from the architecture review of `docs/ARCHITECTURE.md` against `src/`. Update
`docs/ARCHITECTURE.md` alongside each change (see `AGENTS.md`).

## Test coverage

Current suite: 145 jsdom tests (`pnpm test`) and 17 Playwright tests against the demo
(`pnpm test:e2e`). Update section 15 of `docs/ARCHITECTURE.md` as these land.

### Real browser (Playwright against `demo/`)

- [ ] Optional: frame-timing or screenshot checks for scroll lag and jitter.
- [ ] Run e2e in CI (needs `pnpm exec playwright install --with-deps chromium`); consider
  adding WebKit and Firefox projects.
