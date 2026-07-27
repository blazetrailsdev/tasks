---
title: "Converge adapter-prevent-writes onto the canonical subscribers shape"
status: ready
updated: 2026-07-27
rfc: "0023-surfaced-deviations"
cluster: null
deps: []
deps-rfc: []
est-loc: 40
priority: null
pr: null
claim: null
assignee: null
blocked-by: null
closed-reason: null
---

## Context

Surfaced while fixing `restore-subscribers-canonical-table` (PR #5256).

`packages/activerecord/src/adapters/mysql2/mysql2-adapter.trails.test.ts` was
the last shared-DB offender and now lays `subscribers` via
`rebuildCanonicalTables`. The remaining hand-rolled `subscribers` in the AR
suite is `packages/activerecord/src/adapter-prevent-writes.test.ts:17`:

```ts
`CREATE TABLE "subscribers" ("id" INTEGER PRIMARY KEY AUTOINCREMENT, "nick" TEXT)`;
```

That shape is invented — the canonical table
(`packages/activerecord/src/test-helpers/test-schema.ts:1430`, mirroring
`vendor/rails/activerecord/test/schema/schema.rb:1169`) is `id: false` with
`nick` (NOT NULL, unique index, PK at the AR layer), `name`, `id` (plain
integer), `books_count`, `update_count`.

This is **not** a flake source: the file builds its own
`new BetterSQLite3Adapter(":memory:")` in `beforeEach` and drops the table in
`afterEach`, so it never touches the shared per-worker DB and never trips
`repairWorkerSchema`. It is purely an RFC 0059 "canonical tables only, no
bespoke tables" violation — a canonical table _name_ carrying a fabricated
shape, which is exactly the pattern that makes drift hard to spot by grep.

Rails' `adapter_prevent_writes_test.rb` runs against the real fixture
`subscribers`, so converging here also moves the file toward the Rails source.

## Acceptance criteria

- `adapter-prevent-writes.test.ts` obtains `subscribers` in its canonical
  shape (e.g. `rebuildCanonicalTables(adapter, ["subscribers"])`) instead of
  the inline `CREATE TABLE`.
- The INSERT/UPDATE/DELETE probes still work against the canonical shape —
  note `nick` is NOT NULL with a unique index and there is no autoincrement
  `id`, so repeated `INSERT ... VALUES ('test')` across tests must not collide
  (the per-test `:memory:` adapter already gives a fresh database each time).
- No test renamed; `test:compare` delta >= 0.
