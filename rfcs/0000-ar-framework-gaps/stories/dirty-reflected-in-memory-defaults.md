---
title: "Reflected in-memory defaults applied on new"
status: ready
updated: 2026-06-04
rfc: "0000-ar-framework-gaps"
cluster: dirty-tracking
deps: []
deps-rfc: []
est-loc: 40
priority: 45
pr: null
claim: null
assignee: null
blocked-by: null
---

## Context

From `dirty-test-framework-gaps.md`. `new Topic().approved` is `null`, not the
schema default `true`. Only `attribute(..., { default })` defaults apply; schema
(reflected) defaults aren't materialized on `new`.

## Acceptance criteria

- [ ] Reflected schema column defaults apply to in-memory attributes on `new`.
- [ ] Un-skips: `attribute should be compared with type cast` (1).

## Notes

Rails: column default → in-memory attribute on `new`.
