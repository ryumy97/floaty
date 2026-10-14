---
name: design-md
description: Validates a DESIGN.md design-system file against the DESIGN.md format spec (YAML front-matter design tokens plus ordered markdown sections) and fixes it by running the `@google/design.md` linter until it passes. Use when creating, editing, reviewing or validating a DESIGN.md, design tokens in its front matter, or when the user mentions DESIGN.md, design.md lint, or the design system spec.
---

# DESIGN.md validation

Validate a DESIGN.md against the spec in [spec.md](spec.md), and fix it, by running the
linter to validate and fix:

```bash
npx @google/design.md lint DESIGN.md
```

In pnpm projects (like this repo), run it as `pnpm dlx @google/design.md lint DESIGN.md`.

## Workflow

```
- [ ] 1. Lint the file
- [ ] 2. Fix every error, then warnings
- [ ] 3. Check what the linter misses
- [ ] 4. Re-lint until there are no errors
- [ ] 5. Report
```

**1. Lint.** Output is JSON: `findings[]` (each with `severity`, `message`, and usually
`path` and `rule`) and `summary` (`errors`, `warnings`, `infos`). The exit code is 1 when
there are errors. `--format=text` is accepted but currently still prints JSON.

**2. Fix.** Errors first, then warnings. Infos need no change unless the user asks.

| Finding | Fix |
| --- | --- |
| invalid color (`colors.<name>`) | Use a CSS color; prefer `#RRGGBB` |
| invalid unit | Dimensions take only `px`, `em`, `rem` (`4pt` → `4px`) |
| `broken-ref`: reference doesn't resolve | Point `{path.to.token}` at an existing token, or define the token |
| `broken-ref`: unknown component sub-token | Use `backgroundColor`, `textColor`, `typography`, `rounded`, `padding`, `size`, `height`, `width`; ask before dropping other properties |
| `missing-primary` | Rename the main brand color to `primary`, or add it |
| `missing-typography` | Add typography tokens for the levels the prose describes |
| `contrast-ratio` | Adjust the component's `backgroundColor`/`textColor` pair to reach 4.5:1 |
| `orphaned-tokens` | Reference the token from a component, or leave it (a warning, not an error) |
| `section-order` | Move `##` sections into the canonical order (below) |
| `unknown-key` | Fix the top-level key typo |
| `token-like-ignored` | Move the map under a schema key, or remove it |
| `missing-sections` (info) | If intentional, list the section under `omitted` (with a `reason`) |

**3. Check what the linter misses.** The linter (v0.4.0) does not flag these spec violations;
check them by reading the file:

- Duplicate `##` section headings (aliases count: `Overview` and `Brand & Style` are the
  same section). The spec says to reject the file; merge the duplicates.
- Unitless dimensions: `fontSize`, `letterSpacing`, `rounded.*` and component `rounded`,
  `padding`, `size`, `height`, `width` need `px`, `em` or `rem`. Only `lineHeight` and
  `spacing.*` may be bare numbers. `fontWeight` is a number (quoted or bare).
- Front matter delimiters are lines containing exactly `---`, at the very start of the file.
- References outside `components` must point to a primitive value, not a group or a
  composite like `{typography.h1}`.
- Prose and tokens agree: colors and fonts named in `## Colors` / `## Typography` match the
  token values (the tokens are normative).

**4. Re-lint** after each round of fixes until `summary.errors` is 0.

**5. Report** the remaining warnings and infos and why they were kept.

## Canonical section order

All sections are `##`; an optional `#` title is not a section. Unknown sections (for example
`## Iconography`) are allowed; keep them.

1. Overview (also: Brand & Style)
2. Colors
3. Typography
4. Layout (also: Layout & Spacing)
5. Elevation & Depth (also: Elevation)
6. Shapes
7. Components
8. Do's and Don'ts

## Fixing rules

- Don't invent brand values. When a fix needs a design decision (a new color, a missing
  font), ask, or derive it from the file's prose.
- Change only what a finding or a spec rule requires; keep the author's prose and token names.
- `design.md spec` prints the spec bundled with the linter, and `design.md spec --rulesOnly`
  its rules table; if their version differs from [spec.md](spec.md), follow the linter's.
