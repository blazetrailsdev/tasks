---
title: "Campfire example: controllers, views and helpers"
status: draft
updated: 2026-11-27
rfc: "0000-campfire-port"
cluster: campfire-app
packages: []
deps:
  [
    campfire-models-and-migrations,
    geared-pagination-port,
    rails-autolink-port,
    platform-agent-port,
    lexxy-engine-port,
    rqrcode-port,
    jbuilder-port,
  ]
deps-rfc: []
est-loc: 700
priority: null
pr: null
claim: null
assignee: null
blocked-by: null
---

## Context

RFC § Design. 48 controllers (1,591 lines), 90 views as `.tse` (2,347
lines), helpers. Uses geared_pagination, auto_link, `ApplicationPlatform`,
Lexxy's `rich_text_area` and `lexxy_prompt`, rqrcode and eight jbuilder views.

## Acceptance criteria

- [ ] every controller, view and helper ported file for file
- [ ] controller tests ported and passing; if over the ceiling, split by controller namespace into sibling stories
