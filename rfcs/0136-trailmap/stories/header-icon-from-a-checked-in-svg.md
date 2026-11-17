---
title: "The header icon is drawn from a checked-in SVG, and the favicons are generated from it"
status: done
updated: 2026-11-16
rfc: "0136-trailmap"
cluster: null
packages: []
deps: []
deps-rfc: []
est-loc: 60
priority: null
pr: trailmap#148
claim: "2026-11-16T22:21:26Z"
assignee: "command-palette-footer-hints-follow-the-mode"
blocked-by: null
closed-reason: null
---

## Context

The header now shows the app icon (`app/views/layouts/application.html.tse:17`,
`imageTag("/icon.png", { size: 24, alt: "" })`). The only artwork that exists
is the raster favicon set in `public/` and `rails/public/` (`icon.png` is
512x512, 66 KB, added in #116/#117); `app/assets/images` is empty and there is
no vector source. So a 66 KB PNG is downloaded to draw a 24px mark, it cannot
be recoloured or given a single-colour variant for dark mode, and its warm
palette is the one colour on the page outside `docs/style-guide.md`.

## Acceptance criteria

- An SVG of the mark is checked in under `app/assets/images` and is what the
  header draws, in both apps.
- The favicon PNGs are generated from it by a script, so the two cannot drift.
- The header mark is legible at 24px in light and dark.
