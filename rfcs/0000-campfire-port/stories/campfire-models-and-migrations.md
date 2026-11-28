---
title: "Campfire example: models, concerns and migrations"
status: draft
updated: 2026-11-27
rfc: "0000-campfire-port"
cluster: campfire-app
packages: []
deps: [vendor-campfire-source]
deps-rfc: []
est-loc: 700
priority: null
pr: null
claim: null
assignee: null
blocked-by: null
---

## Context

RFC § Design. 45 model files (1,828 lines) and 18 migrations. `Room` uses
`becomes!` across STI (`Rooms::Closed`), `Message` has `has_rich_text :body`,
`User` calls `remote_connections`. Framework gaps go to their package's
surfaced-deviations bucket.

## Acceptance criteria

- [ ] `examples/campfire` scaffolded as `examples/electron-writebook` is, minus Electron
- [ ] every model, concern and migration ported file for file
- [ ] model tests ported and passing; if over the ceiling, the rest filed as a sibling story
