---
title: "Campfire example: stylesheets messages.css through utilities.css, and images"
status: draft
updated: 2026-11-27
rfc: "0000-campfire-port"
cluster: campfire-app
packages: [examples, vite-trails]
deps: [vendor-campfire-source]
deps-rfc: []
est-loc: 1450
priority: null
pr: null
claim: null
assignee: null
blocked-by: null
---

## Context

RFC § Design (The app). The other 9 files in `app/assets/stylesheets/`,
`messages.css` through `utilities.css` (1,401 lines), and the 73 files in
`app/assets/images/`. 37signals' marks and icons are left out, as Bookshelf
leaves out Writebook's.

## Acceptance criteria

- [ ] each listed stylesheet and image copied byte for byte, less 37signals' marks
- [ ] `pnpm build:assets` serves them at the paths the views reference
