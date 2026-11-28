---
title: "geared-pagination: port the gem"
status: draft
updated: 2026-11-27
rfc: "0000-campfire-port"
cluster: campfire-deps
packages: [geared-pagination]
deps: [addressable-uri-query-values]
deps-rfc: []
est-loc: 550
priority: null
pr: null
claim: null
assignee: null
blocked-by: null
---

## Context

RFC § Design. 13 files, 513 lines. Campfire calls
`set_page_and_extract_portion_from` with `per_page:` in
`accounts_controller.rb:8`, `accounts/users_controller.rb:5` and
`autocompletable/users_controller.rb:3`. The gem is a controller concern
plus ratio and cursor pagination over a relation, and writes `Link` headers
through Addressable.

## Acceptance criteria

- [ ] `geared_pagination` 1.2.0 vendored, `packages/geared-pagination` created
- [ ] `Controller`, `Recordset`, `Page`, `Portions`, `Ratios`, `Cursor`, `Headers` ported
- [ ] the gem's test suite ported and passing
