---
title: "Campfire example: stylesheets actiontext.css through lightbox.css"
status: draft
updated: 2026-11-27
rfc: "0000-campfire-port"
cluster: campfire-app
packages: [examples, vite-trails]
deps: [vendor-campfire-source]
deps-rfc: []
est-loc: 2000
priority: null
pr: null
claim: null
assignee: null
blocked-by: null
---

## Context

RFC § Design (The app). The first 17 of the 26 files in
`app/assets/stylesheets/`, alphabetically `actiontext.css` through
`lightbox.css` (1,977 lines). `actiontext.css` maps Lexxy's CSS variables to
Campfire's palette. Bookshelf copies `app/assets` flat to `/assets` with
`pnpm build:assets`.

## Acceptance criteria

- [ ] each listed stylesheet copied byte for byte
- [ ] `pnpm build:assets` serves them at the paths the views reference
