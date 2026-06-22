---
title: "persistence-createrecord-single-column-returning-gate"
status: done
updated: 2026-06-22
rfc: "0023-surfaced-deviations"
cluster: null
deps: []
deps-rfc: []
est-loc: null
priority: null
pr: 3854
claim: "2026-06-22T01:10:57Z"
assignee: "persistence-createrecord-single-column-returning-gate"
blocked-by: null
---

## Context

Flagged in review of PR #3835. The live INSERT write-back path is
`Base#_performInsert` (`packages/activerecord/src/base.ts`), which now gates the
explicit RETURNING clause at a single column
(`explicitReturning = returningColumns.length === 1 ? returningColumns : undefined`)
so trails' scalar adapters (PG executeMutation returns only the first RETURNING
column; SQLite/MySQL return one generated value) never mis-map a multi-column
RETURNING.

The standalone `_createRecord` in `packages/activerecord/src/persistence.ts:1700-1760`
is an ALTERNATE/UNUSED create path that still passes the full multi-column
`returningColumns` straight into `_insertRecord` with no `length === 1` gate, so
it carries the exact multi-column-RETURNING mis-map this PR fixed in base.ts.
Not on the live path today, so not a bug — but the two implementations of the
same Rails `_create_record` now diverge, and wiring this path up would
reintroduce the composite-PK regression.

## Acceptance criteria

- [x] `persistence.ts` `_createRecord` either reuses `Base#_performInsert`'s
      single-column RETURNING gating, or is removed if confirmed dead.
      (PR #3854: removed — confirmed dead, non-exported module locals.)
- [x] If kept: composite-PK and id-less-table inserts via this path resolve
      correctly on sqlite/postgres/mysql (no multi-column RETURNING mis-map).
      (N/A — path removed, not kept.)
- [x] `pnpm lint` + typecheck clean.
