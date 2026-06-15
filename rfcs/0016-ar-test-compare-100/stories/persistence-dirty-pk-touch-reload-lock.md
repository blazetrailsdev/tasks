---
title: "Honor id_in_database in touch/reload/pessimistic-lock row targeting"
status: claimed
updated: 2026-06-15
rfc: "0016-ar-test-compare-100"
cluster: core-residuals
deps: []
deps-rfc: []
est-loc: 90
priority: null
pr: null
claim: "2026-06-15T12:40:11Z"
assignee: "persistence-dirty-pk-touch-reload-lock"
blocked-by: null
---

## Context

Surfaced by #3244 (locking-dirty-primary-key). That PR fixed the
update/delete/destroy WHERE clauses to target `id_in_database` for a dirty
(in-memory mutated) primary key, but three other row-targeting paths still build
their WHERE from the current in-memory `this.id`:

- `timestamp.ts:111` — `_touchRow` / touch UPDATE
- `persistence.ts:1137` — `reload` SELECT
- `locking/pessimistic.ts:30` — `lock!` reload (`SELECT … FOR UPDATE`)

Rails routes these through `_query_constraints_hash` too (touch → `_update_row`;
`reload`/`lock!` re-find by the persisted key), so a record whose primary key was
reassigned in memory would target the wrong row (or no row) in these paths. No
Rails test in the dirty-primary-key set (locking_test.rb:202-239) exercises these
three, so #3244 left them as-is to stay in scope — but the divergence is real.

## Acceptance criteria

- `touch`, `reload`, and `lock!` target `id_in_database` (consistent with the
  update/delete/destroy fix in #3244), with the simple single-PK and
  composite-PK cases unchanged.
- Port whichever Rails cases cover dirty-PK touch/reload/lock behavior verbatim
  (or, if none exist upstream, add coverage named to match the closest Rails
  test) and confirm no regression in `locking` / `dirty` / `persistence` suites.
