---
title: "insert_all/upsert_all returning → ActiveRecord::Result"
status: done
updated: 2026-06-17
rfc: "0030-ar-test-compare-residual-burndown"
cluster: persistence
deps: []
deps-rfc: []
est-loc: 200
priority: null
pr: 3447
claim: "2026-06-16T11:59:00Z"
assignee: "d2-insert-all-returning-result"
blocked-by: null
---

## Context

Follow-up from d2-insert-all-on-duplicate (RFC 0030). `insert_all`/`upsert_all`
currently return an affected-row `number` from `execute()` →
`connection.executeMutation(toSql())` (packages/activerecord/src/insert-all.ts:132).
Rails returns an `ActiveRecord::Result` whose `.columns` / `.pluck` / `.rows`
expose the RETURNING values. The `RETURNING` clause is already emitted by
`Builder.returning()` and SQLite/PG support it, but the rows are discarded.

Wiring this requires changing the `insertAll*`/`upsertAll`/`insert*` return type
from `number` to a Result across relation.ts + querying.ts, plus PG/SQLite row
extraction and type-casting — a cross-cutting API change that ripples to ~20
existing tests asserting numeric counts. Deliberately deferred from d2.

Blocks these `it.skip` tests in `packages/activerecord/src/insert-all.test.ts`:

- insert all with returning
- upsert all supports returning option
- insert_all with returning and on_duplicate
- insert all returns requested sql fields
- insert all returns primary key if returning is supported
- insert with type casting and serialize is consistent
- insert all and upsert all with aliased attributes (returning sub-block)

## Acceptance criteria

- [ ] `insert_all!`/`upsert_all` with `returning:` return a Result-like object
      exposing `.columns` and `.pluck`, type-cast via the column types.
- [ ] The listed tests are un-skipped and pass on SQLite and PG.
- [ ] Existing numeric-count assertions migrated or preserved.
