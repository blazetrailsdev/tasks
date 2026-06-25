---
title: "live-create-path-uses-insert-record"
status: claimed
updated: 2026-06-25
rfc: "0023-surfaced-deviations"
cluster: null
deps: []
deps-rfc: []
est-loc: null
priority: null
pr: null
claim: "2026-06-25T12:19:31Z"
assignee: "live-create-path-uses-insert-record"
blocked-by: null
---

## Context

Surfaced in review of PR #3854 (dead-code removal of the duplicate
`persistence.ts` `_createRecord`). With that duplicate gone, the live INSERT
write-back path runs entirely through `Base#_performInsert`
(`packages/activerecord/src/base.ts:3070`), which builds its own
`InsertManager` and **does not** call the ported `_insertRecord`
(`packages/activerecord/src/persistence.ts:216`, "Mirrors `_insert_record`")
nor `_returningColumnsForInsert` (`model-schema.ts:1447`). base.ts:3202 already
documents this: "A proper follow-up should implement `_returningColumnsForInsert`
and pass explicit returning."

Rails' real create path is `_create_record` → `_insert_record(values)` (a class
method on `Persistence::ClassMethods`). trails instead uses a non-Rails
`_performInsert` instance method, leaving the faithful `_insertRecord` /
`_returningColumnsForInsert` class methods present-but-unused. `_insertRecord`
is deliberately retained (it mirrors a real Rails class method and counts in
api:compare's data-layer surface — removing it would be a negative delta), but
the live path bypassing it is the actual Rails-fidelity gap.

## Acceptance criteria

- [ ] Live create write-back routes through the Rails-faithful
      `_insert_record` class method (and `_returningColumnsForInsert` for the
      explicit RETURNING gate) rather than the bespoke `_performInsert`, OR a
      documented decision records why `_performInsert` stays with the two
      class methods reconciled/removed accordingly.
- [ ] Single-column RETURNING gating preserved (no multi-column mis-map on
      sqlite/postgres/mysql); composite-PK and id-less inserts resolve.
- [ ] api:compare and test:compare delta non-negative.
- [ ] `pnpm lint` + typecheck clean.
