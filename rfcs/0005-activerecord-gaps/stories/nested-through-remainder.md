---
title: "Nested-through remainder (scope, default_scope, shared-source reset, HMT autosave)"
status: done
updated: 2026-06-04
rfc: "0005-activerecord-gaps"
cluster: associations
deps: []
deps-rfc: []
est-loc: 200
pr: null
claim: null
assignee: null
blocked-by: null
---

## Context

A cluster of nested-through gaps gated on the H2 nested-through remainder work:

- HABTM-into-polymorphic-source joins and scope
  (`has many through polymorphic with scope`)
- `default_scope` query-method injection through-model
  (`joins and includes from through models not included in association`)
- shared-source preload reset
  (`through association preload doesnt reset source association if already
preloaded`)
- nested HMT autosave exclusion (`nested has many through should not be
autosaved`)

## Acceptance criteria

- [ ] Each of the four nested-through tests above unskipped and green
- [ ] (May split into per-test PRs as H2 lands)

## Notes

From the associations gap plan. Blocked on H2 nested-through remainder. Likely
splits into multiple PRs — re-scope when H2 lands.
