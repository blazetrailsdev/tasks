---
title: "Vendor Campfire v1.5.13 for the example port"
status: draft
updated: 2026-11-27
rfc: "0000-campfire-port"
cluster: campfire-app
packages: [scripts]
deps: []
deps-rfc: []
est-loc: 30
priority: null
pr: null
claim: null
assignee: null
blocked-by: null
---

## Context

RFC § Design. Writebook is vendored as `writebook` at `v1.2.9` in
`vendor/sources.ts:913-923`. Campfire is `https://github.com/basecamp/once-campfire.git`,
MIT (`MIT-LICENSE`).

## Acceptance criteria

- [ ] a `campfire` entry at `v1.5.13` in `vendor/sources.ts`, `packages: []`
- [ ] `pnpm vendor:fetch` populates `vendor/campfire/v1.5.13`
