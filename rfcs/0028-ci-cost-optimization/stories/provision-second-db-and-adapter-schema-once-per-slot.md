---
title: "Lay the arunit2 + adapter-specific schema once per slot DB, not once per test file"
status: draft
updated: 2026-07-30
rfc: "0028-ci-cost-optimization"
cluster: null
deps: []
deps-rfc: []
est-loc: 180
priority: null
pr: null
claim: null
assignee: null
blocked-by: null
closed-reason: null
---

## Context

`test-setup-dy.ts` runs once per **test file** (measured: 8 files -> 8 distinct
pids). Its last two phases re-lay schema that is already in the slot database:

1. `loadAdapterSpecificSchema(await Base.leaseConnection())`
   (`packages/activerecord/src/test-setup-dy.ts:82-83`, impl
   `src/support/load-schema-helper.ts:609-612`) — the
   `<adapter>_specific_schema.rb` arm.
2. `provisionSecondDatabase()` (`test-setup-dy.ts:88-89`, impl
   `src/support/setup-second-pool.ts:51-63`) — which calls
   `rebuildCanonicalTables(arunit2, ARUNIT2_TABLES)` (drop+recreate `colleges`,
   `courses`, `professors`, `courses_professors`) and
   `createOtherDogsTable` with `force: true` (drop+recreate `dogs`).

So every AR test file — including the ~340 that touch no DDL at all — issues
~10 DROP/CREATE TABLE statements plus their indexes before its first test runs.
The DDL profiler confirms it: on a run with the profiler installed _before_
`test-setup-dy`, the 6 non-schema files each emitted 12-29 DDL ops, dominated by
`DROP/CREATE colleges | courses | professors | courses_professors | dogs`
(`CREATE_TABLE courses` x10, `DROP_TABLE courses` x8 across 8 files).

Rails creates these tables exactly once, in `schema.rb` itself
(`vendor/rails/activerecord/test/schema/schema.rb:1444-1462`, laid through
`Course.lease_connection`), during the single per-process
`load_schema` at `vendor/rails/activerecord/test/cases/test_case.rb:298-300`.
Nothing re-lays them per file.

Measured cost, sqlite lane (instrumented `test-setup-dy.ts`, 8 files,
`TRAILS_TEST_FORKS=2`): `adapterSpecificSchema` 12-20 ms/file and
`provisionSecondDatabase` 36-109 ms/file — together ~50 ms x ~697 files ~=
**35 s per lane**, and DROP TABLE is the single most expensive schema op on
PG/MySQL (RFC 0060: ~95% of schema-DDL wall time).

This is distinct from RFC 0079's `retire-setup-second-pool-rebuilds`, which
changes _how_ `setup-second-pool.ts` lays these tables (off
`rebuildCanonicalTables`). This story is about _how often_ the bootstrap invokes
it — even a `loadCanonicalSchema`-based provisioner run once per test file is
the same churn. The two should land in either order without conflicting.

## Acceptance criteria

- `loadAdapterSpecificSchema` and `provisionSecondDatabase` run once per slot
  database per run, not once per test file — memoised across processes (marker
  keyed on slot + run token, cf. `support/run-token.ts` and the
  `ensureWorkerClone` "already exists" check at
  `support/sqlite-template.ts:214`), or folded into the sqlite/PG template build
  in `support/template-global-setup.ts`.
- The arunit2 tables and `dogs` still carry the shapes `schema.rb:1444-1462`
  specifies on a fresh slot DB, and `MultipleDbTest` / `base-prevent-writes` /
  connection-swapping suites stay green (they mutate these tables via
  `withSecondPool`, `setup-second-pool.ts:104-107` — the memo must not make a
  suite's teardown someone else's stale state).
- Before/after instrumented per-phase numbers on the sqlite lane in the PR.
- Full AR suite green on all three lanes across repeated co-scheduled runs.
