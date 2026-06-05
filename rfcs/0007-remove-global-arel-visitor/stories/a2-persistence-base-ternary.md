---
title: "Phase A2 — make persistence.ts + base.ts ternary callers unconditional"
status: done
updated: 2026-06-04
rfc: "0007-remove-global-arel-visitor"
cluster: arel-visitor
deps: []
deps-rfc: []
est-loc: 150
pr: null
claim: null
assignee: null
blocked-by: null
---

## Context

~7 sites already do the defensive ternary
`adapter.toSql ? adapter.toSql(x) : x.toSql()` (e.g. `persistence.ts:218/254/281`,
`base.ts:2586/2731/2779`). Drop the `: x.toSql()` global-leak fallback and route
unconditionally through `connection.toSql`.

See RFC 0007 §Plan (Phase A2).

## Acceptance criteria

- [ ] `persistence.ts` and `base.ts` ternary sites compile via `connection.toSql`
      unconditionally
- [ ] The `: x.toSql()` fallback removed at these sites
- [ ] Dialect SQL unchanged in existing tests

## Notes

From the arel-visitor plan (Phase A2).
