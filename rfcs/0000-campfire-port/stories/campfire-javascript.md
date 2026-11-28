---
title: "Campfire example: JavaScript, Stimulus and the Lexxy editor on Vite"
status: draft
updated: 2026-11-27
rfc: "0000-campfire-port"
cluster: campfire-app
packages: [examples, stimulus, turbo, vite-trails]
deps: [vendor-campfire-source, lexxy-engine-port]
deps-rfc: []
est-loc: 3900
priority: null
pr: null
claim: null
assignee: null
blocked-by: null
---

## Context

RFC § Design (The app) and § The LOC ceiling is lifted. 71 files, 3,855 lines
under `app/javascript`, pinned by `config/importmap.rb`. They include
`lib/rich_text/campfire_extension.js` (`extends Lexxy.Extension`) and
`lib/rich_text/cite_node.js` (`Lexxy.Lexical.ElementNode`). Lexxy's editor
ships built in the gem as `app/assets/javascript/lexxy.js`. Bookshelf copied
Writebook's Stimulus controllers and `house.min.js` byte for byte under Vite.

## Acceptance criteria

- [ ] every file copied as written, except import specifiers Vite needs, each receipted
- [ ] `lexxy.js` served from `packages/lexxy` as the gem serves it, with `@hotwired/turbo-rails` and `@hotwired/stimulus` as npm dependencies
- [ ] the Stimulus manifest written by `bin/trails stimulus:manifest:update`
- [ ] `pnpm build:assets` succeeds
