---
title: "SQL-function column defaults in defineSchema"
status: ready
rfc: "0000-ar-framework-gaps"
cluster: dirty-tracking
deps: []
deps-rfc: []
est-loc: 40
priority: 51
pr: null
claim: null
assignee: null
blocked-by: null
---

## Context

From `dirty-test-framework-gaps.md`. `aircraft.manufactured_at` isn't
auto-populated — SQL-function column defaults (`CURRENT_TIMESTAMP`) in
`defineSchema` aren't applied.

## Acceptance criteria

- [ ] SQL-function column defaults (e.g. `CURRENT_TIMESTAMP`) are honored.
- [ ] Un-skips: `partial insert off with unchanged default function attribute` (1).

## Notes

Schema-default function support in `defineSchema`.
