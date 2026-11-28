---
title: "Campfire example: Stimulus controllers, helpers and initializers on Vite"
status: draft
updated: 2026-11-27
rfc: "0000-campfire-port"
cluster: campfire-app
packages: [examples, stimulus, turbo, vite-trails]
deps: [vendor-campfire-source, lexxy-engine-port]
deps-rfc: []
est-loc: 2000
priority: null
pr: null
claim: null
assignee: null
blocked-by: null
---

## Context

RFC § Design (The app). `app/javascript/controllers/` (1,740 lines),
`helpers/` (117), `initializers/` (80, including `rich_text.js`'s
`Lexxy.configure`) and `application.js`, pinned by `config/importmap.rb`.
Bookshelf copied Writebook's Stimulus controllers byte for byte under Vite.

## Acceptance criteria

- [ ] every listed file copied as written, except import specifiers Vite needs, each receipted
- [ ] `@hotwired/turbo-rails` and `@hotwired/stimulus` as npm dependencies, and the app consumes the `lexxy.js` that `packages/lexxy` serves
- [ ] the Stimulus manifest written by `bin/trails stimulus:manifest:update`
- [ ] `pnpm build:assets` succeeds
