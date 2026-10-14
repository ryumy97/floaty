---
version: alpha
name: Paper & Float
description: Floaty's visual identity. A flat, calm page of paper and ink; only floating content carries color and depth, and dashed anchors mark where it can land.
colors:
  primary: "#4F46E5"
  primary-hover: "#4338CA"
  on-primary: "#FFFFFF"
  ink: "#1D1D27"
  ink-hover: "#34343F"
  secondary: "#6B6B7B"
  neutral: "#F6F5F2"
  surface: "#FFFFFF"
  border: "#E4E2DC"
  anchor: "#C4C2F5"
  anchor-fill: "#F1F0FD"
  error: "#DC2626"
  neutral-dark: "#121218"
  surface-dark: "#1B1B24"
  ink-dark: "#ECECF1"
  secondary-dark: "#A1A1B0"
  border-dark: "#2C2C38"
  anchor-dark: "#4B4794"
  anchor-fill-dark: "#1E1D33"
typography:
  headline-display:
    fontFamily: Inter
    fontSize: 48px
    fontWeight: 700
    lineHeight: 1.1
    letterSpacing: -0.02em
  headline-lg:
    fontFamily: Inter
    fontSize: 36px
    fontWeight: 700
    lineHeight: 1.15
    letterSpacing: -0.02em
  headline-md:
    fontFamily: Inter
    fontSize: 24px
    fontWeight: 600
    lineHeight: 1.25
    letterSpacing: -0.01em
  headline-sm:
    fontFamily: Inter
    fontSize: 18px
    fontWeight: 600
    lineHeight: 1.4
  body-lg:
    fontFamily: Inter
    fontSize: 18px
    fontWeight: 400
    lineHeight: 1.6
  body-md:
    fontFamily: Inter
    fontSize: 16px
    fontWeight: 400
    lineHeight: 1.6
  body-sm:
    fontFamily: Inter
    fontSize: 14px
    fontWeight: 400
    lineHeight: 1.5
  label-md:
    fontFamily: Inter
    fontSize: 14px
    fontWeight: 500
    lineHeight: 1.2
  label-sm:
    fontFamily: Inter
    fontSize: 12px
    fontWeight: 500
    lineHeight: 1.2
    letterSpacing: 0.02em
  code-md:
    fontFamily: JetBrains Mono
    fontSize: 14px
    fontWeight: 400
    lineHeight: 1.6
  code-sm:
    fontFamily: JetBrains Mono
    fontSize: 12px
    fontWeight: 400
    lineHeight: 1.5
rounded:
  none: 0px
  sm: 6px
  md: 8px
  lg: 12px
  xl: 16px
  full: 9999px
spacing:
  xs: 4px
  sm: 8px
  md: 16px
  lg: 24px
  xl: 32px
  2xl: 64px
  gutter: 24px
  content-width: 768px
components:
  page:
    backgroundColor: "{colors.neutral}"
    textColor: "{colors.ink}"
    typography: "{typography.body-md}"
  floaty-content:
    backgroundColor: "{colors.primary}"
    textColor: "{colors.on-primary}"
    typography: "{typography.label-md}"
    rounded: "{rounded.xl}"
  floaty-content-hover:
    backgroundColor: "{colors.primary-hover}"
  floaty-card:
    backgroundColor: "{colors.surface}"
    textColor: "{colors.ink}"
    typography: "{typography.body-sm}"
    rounded: "{rounded.xl}"
    padding: 12px
  floaty-anchor:
    backgroundColor: "{colors.anchor-fill}"
    textColor: "{colors.secondary}"
    rounded: "{rounded.xl}"
  button-primary:
    backgroundColor: "{colors.ink}"
    textColor: "{colors.surface}"
    typography: "{typography.label-md}"
    rounded: "{rounded.md}"
    padding: 16px
    height: 40px
  button-primary-hover:
    backgroundColor: "{colors.ink-hover}"
  button-secondary:
    backgroundColor: "{colors.surface}"
    textColor: "{colors.ink}"
    typography: "{typography.label-md}"
    rounded: "{rounded.md}"
    padding: 16px
    height: 40px
  input-field:
    backgroundColor: "{colors.surface}"
    textColor: "{colors.ink}"
    typography: "{typography.body-sm}"
    rounded: "{rounded.md}"
    height: 36px
  kbd:
    backgroundColor: "{colors.surface}"
    textColor: "{colors.secondary}"
    typography: "{typography.code-sm}"
    rounded: "{rounded.sm}"
  code-inline:
    backgroundColor: "{colors.neutral}"
    textColor: "{colors.ink}"
    typography: "{typography.code-md}"
    rounded: "{rounded.sm}"
  page-dark:
    backgroundColor: "{colors.neutral-dark}"
    textColor: "{colors.ink-dark}"
  floaty-card-dark:
    backgroundColor: "{colors.surface-dark}"
    textColor: "{colors.ink-dark}"
  floaty-anchor-dark:
    backgroundColor: "{colors.anchor-fill-dark}"
    textColor: "{colors.secondary-dark}"
---

# Floaty

## Overview

Floaty renders content once, on a layer above the page, and lets it fly between placeholder
anchors. The visual identity makes that model visible: **the page is paper, and floating
content is the only thing that lifts off it.**

The page is flat and quiet: warm off-white, ink text, hairline borders, no shadows. Anything
that floats is colored and elevated, so a reader can tell at a glance what is floating
content and what is layout. Empty anchors are drawn as dashed outlines, the slot where content
can land. The audience is React developers, so the tone is precise and friendly rather than
decorative: generous whitespace, one accent color, and springy motion as the personality.

## Colors

One accent on a neutral page. Color means "this floats".

- **Floaty Indigo (`primary`, #4F46E5):** reserved for floating content: the demo blob,
  floating cards' focus rings, the active state of something in flight. Never used for page
  chrome, links or primary page buttons. Hover and pressed states use `primary-hover`
  (#4338CA).
- **Ink (`ink`, #1D1D27):** headings, body text and the primary page button. A soft
  near-black with a hint of blue so it sits with the indigo.
- **Slate (`secondary`, #6B6B7B):** captions, metadata, anchor labels and keyboard hints.
- **Paper (`neutral`, #F6F5F2):** the page background; warm, so white floating cards read as
  lifted.
- **Surface (`surface`, #FFFFFF):** cards, inputs and neutral floating content (search box,
  chat panel).
- **Hairline (`border`, #E4E2DC):** 1px borders that separate page regions instead of shadows.
- **Anchor Lavender (`anchor`, #C4C2F5, fill `anchor-fill` #F1F0FD):** the dashed outline and
  faint fill of an empty anchor.
- **Error (`error`, #DC2626):** validation and destructive actions only.

Dark mode keeps the same roles with the `-dark` tokens: a near-black page (`neutral-dark`),
slightly raised surfaces (`surface-dark`), light ink (`ink-dark`) and a deeper anchor
lavender. Floaty Indigo stays the same in both modes.

## Typography

**Inter** for everything a person reads, **JetBrains Mono** for code, keyboard hints and live
numbers (counters, timers, coordinates).

- **Headlines:** Inter Bold for display and large headlines with tight tracking (-0.02em);
  Semi-Bold for medium and small headlines.
- **Body:** Inter Regular at 16px with a 1.6 line height for docs prose; 14px in dense UI such
  as search results and side panels.
- **Labels:** Inter Medium, 12-14px, for buttons, tabs and the text inside floating content.
- **Code:** JetBrains Mono at 14px in code blocks and 12px in `kbd` hints. Use tabular
  figures for anything that counts or ticks, so digits don't shift while content flies.

## Layout & Spacing

A single centered column for reading (max 768px) and the standard docs layout (sidebar,
content, table of contents) for reference pages.

Spacing follows a 4px base scale; most gaps are 8px, 16px or 24px, with 64px between major
page sections. Anchors are laid out like any other block: they reserve exactly the space the
floating content will fill, so layouts never jump when content lands.

## Elevation & Depth

Depth has one meaning: **floating**. The page itself has no shadows; regions are separated by
hairline borders and the paper/surface contrast.

- **Resting float:** floating content sitting on its anchor uses a soft two-layer shadow,
  `0 1px 2px rgb(29 29 39 / 6%), 0 8px 24px rgb(29 29 39 / 12%)`.
- **Lifted float:** floating content promoted above the page (the search dialog, a modal
  photo) uses `0 24px 64px rgb(29 29 39 / 24%)` over a dimmed, blurred backdrop (black at 40%
  in light mode, 60% in dark, 12px blur).
- **Empty anchor:** no shadow; a 1.5px dashed `anchor` outline with an `anchor-fill` tint.

## Shapes

Round and friendly, scaled to the size of the element.

- Floating content and anchors: **16px** (`xl`), so a blob and its slot always match.
- Cards and panels: 12px (`lg`).
- Buttons and inputs: 8px (`md`); keyboard hints and inline code: 6px (`sm`).
- Pills (header search, tags): fully rounded.

An anchor and the floating content that lands on it always share the same corner radius.

## Motion

Motion is part of the brand: content should feel thrown, not tweened.

- Default transition: a spring with a 450ms perceptual duration and a 0.2 bounce. Width and
  height never overshoot (the library default).
- Form changes (full to mini, bar to dialog) happen during the flight, sized in percentages
  of the moving box, never as a jump on landing.
- Page chrome (hover, color changes) uses short 150-200ms ease-out transitions.
- With `prefers-reduced-motion: reduce`, flights snap and only opacity fades remain.

## Components

- **Floating content (blob):** indigo, white label text, 16px radius, resting float shadow.
  Neutral floating UI (search box, chat panel) uses `floaty-card`: white surface, ink text.
- **Anchors:** dashed `anchor` outline (1.5px), `anchor-fill` tint, 16px radius, optional
  slate label centered inside. Anchors that currently hold content show no outline.
- **Buttons:** primary is ink with white text; secondary is a white surface with a hairline
  border. Both are 40px tall with 16px horizontal padding and an 8px radius. Indigo buttons are not used on the page.
- **Input fields:** white surface, hairline border, 8px radius, 36px tall; focus shows a 2px
  indigo ring only when the input is part of floating content, otherwise an ink ring.
- **Keyboard hints:** JetBrains Mono 12px on white with a hairline border and 6px radius.
- **Steppers and toggles:** 28px square secondary buttons; disabled controls drop to 40%
  opacity.

## Do's and Don'ts

- Do keep Floaty Indigo for floating content; the page stays ink and paper
- Do give an anchor and its floating content the same size and corner radius
- Do draw empty anchors as dashed outlines so readers can see where content can land
- Do use shadows only on floating content
- Don't use indigo for links, page buttons or decoration
- Don't animate layout with CSS transitions on the page; let the floating content move
- Don't let content change form on landing; morph it during the flight
- Do maintain WCAG AA contrast (4.5:1 for text), including white on indigo
