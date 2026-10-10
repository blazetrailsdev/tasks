---
title: "A test-opened :memory: pool gets canonical tables through a sanctioned seam, not an inline copy"
status: draft
updated: 2026-10-10
rfc: "0175-activerecord-test-parity-100"
cluster: null
packages: []
deps: []
deps-rfc: []
est-loc: 80
priority: null
pr: null
claim: null
assignee: null
blocked-by: null
closed-reason: null
---

## Context

`packages/activerecord/src/primary-keys.trails.test.ts` ("primary_key on a
key-less table after a reconnect (trails-only)") re-establishes
`KeylessEdge`'s connection from `Base.connectionDbConfig().configurationHash`.
On the `ARCONN=sqlite3_mem` lane that hash is `{ adapter: "sqlite3", database:
":memory:" }`, so the new pool is a second, empty database with no `edges`
table. That reddened `Active Record SQLite :memory: Tests (2)` on main at
02b251fa (trails#8739); trails#8753 fixed it by creating `edges` inline under
`if (inMemoryDb())`, a hand copy of
`vendor/rails/v8.0.2/activerecord/test/schema/schema.rb:571-575`.

The copy exists because there is no sanctioned way for a test to lay canonical
tables on a pool it opens itself:

- `loadCanonicalSchema` (`packages/activerecord/src/support/canonical-schema.ts`)
  and `ensureCanonicalTables`
  (`packages/activerecord/src/support/canonical-table-rebuild.ts`) are closed to
  test files by `blazetrails/no-internal-canonical-loaders`
  (`eslint/no-internal-canonical-loaders.mjs`).
- `fixtures({ ... })` (`packages/activerecord/src/test-fixtures.ts`) provisions
  only the worker's own pool.

Rails has no equivalent problem to mirror: its tests that reconnect either
`skip if in_memory_db?` or reuse the file-backed database.

## Acceptance criteria

- A test that establishes its own pool on the `:memory:` lane can get canonical
  tables onto it through the `fixtures()` surface (or another sanctioned seam
  that `no-internal-canonical-loaders` allows), taking the definition from the
  canonical registry rather than a copy.
- `primary-keys.trails.test.ts` uses that seam and its inline
  `createTable("edges", ...)` is deleted.
- The test still passes under `ARCONN=sqlite3_mem` and on file-backed SQLite,
  and still fails with `expected 'id' to be null` when trails#8739's `base.ts`
  hunk is reverted.
