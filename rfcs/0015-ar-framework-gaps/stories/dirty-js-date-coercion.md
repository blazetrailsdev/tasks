---
title: "JS Date <-> datetime attribute coercion"
status: done
updated: 2026-06-07
rfc: "0015-ar-framework-gaps"
cluster: dirty-tracking
deps: []
deps-rfc: []
est-loc: 40
priority: 50
pr: 2983
claim: "2026-06-06T23:30:56Z"
assignee: "dirty-js-date-coercion"
blocked-by: null
---

## Context

From `dirty-test-framework-gaps.md`. Assigning a JS `Date` to a datetime
attribute reads back `null` / a Temporal, not a `Date`.

## Acceptance criteria

- [ ] A JS `Date` assigned to a datetime attribute round-trips as a comparable
      datetime value.
- [ ] Un-skips: `partial insert off with changed default function attribute` (1).

## Notes

Datetime type coercion on the attribute layer.
