---
title: "Stop truncating every canonical table before every test file"
status: done
updated: 2026-08-05
rfc: "0028-ci-cost-optimization"
cluster: null
deps:
  - set-exclusive-db-flag-for-every-stamped-slot
deps-rfc: []
est-loc: 200
priority: null
pr: 6107
claim: "2026-08-05T00:47:03Z"
assignee: "i18n-date-valid-ordinal-civil-negative-fields"
blocked-by: null
closed-reason: null
---

## Context

`test-setup-dy.ts` runs once per **test file** (measured: 8 files -> 8 distinct
pids), not once per worker as its header comment claims ("The pool it opens lives
for the whole worker"). On the sqlite-file / PG-exclusive / MySQL-exclusive lanes
it calls `DatabaseTasks.reconstructFromSchema`
(`packages/activerecord/src/test-setup-dy.ts:53-58`). When the schema sha1 already
matches — the steady state after the first file on a slot — that path takes the
`schemaUpToDate` arm and calls `truncateTables(config)`
(`packages/activerecord/src/tasks/database-tasks.ts:1408-1411`, truncate impl at
`:1385-1390`), i.e. it empties **every canonical table** before every test file.

Rails does no such thing. Its schema is laid once
(`vendor/rails/activerecord/test/cases/test_case.rb:298-300` ->
`test/support/load_schema_helper.rb:4-21`) and isolation between tests comes
purely from transactional fixtures: `test_case.rb:34` sets
`self.use_transactional_tests = true`, and
`vendor/rails/activerecord/lib/active_record/test_fixtures.rb:113-144` loads
fixtures once per fixture-set key and wraps each test in a transaction that is
rolled back in `teardown_fixtures`. Rows never leak, so nothing is truncated
between files.

trails now has the same mechanism (`src/test-fixtures/with-transactional-fixtures.ts`,
`src/test-fixtures/use-transactional-tests.ts`; 357 of 697 AR test files call
`fixtures(...)`, 85 more use the transactional helpers directly). The per-file
truncate is a leftover guard against files that write rows outside a transaction.

Measured cost (instrumented `test-setup-dy.ts`, 8 files per lane,
`TRAILS_TEST_FORKS=2`), steady state on an exclusive slot:

| lane            | `reconstructFromSchema` per test file | extrapolated over ~697 files |
| --------------- | ------------------------------------- | ---------------------------- |
| sqlite          | 42-70 ms                              | ~38 s                        |
| postgresql      | 273-310 ms                            | ~3.4 min                     |
| mysql (MariaDB) | 1,071-1,336 ms                        | ~14 min                      |

(The first file on each slot additionally pays the genuine one-time purge+load:
365 ms sqlite / ~1.3 s PG.) MySQL is the pathological case — truncating ~250
canonical tables costs over a second every single test file.

Related but separate: `test-setup-worker-db.ts:169,174` only sets the
`AR_*_EXCLUSIVE_DB` flag for `slot > 1`, so the slot-1 worker skips this path
entirely and re-runs the _full_ `loadSchema` per file (PG 1,164-1,318 ms, MySQL
1,948-2,048 ms). That gate flip is its own story,
`set-exclusive-db-flag-for-every-stamped-slot`; land it first so this story's
before/after numbers are measured against a uniform path.

Note the escape hatch already exists but is unused by the suite:
`SKIP_TEST_DATABASE_TRUNCATE` (`database-tasks.ts:1409`).

## Acceptance criteria

- Truncate-all no longer runs once per test file in the steady state. Either the
  bootstrap is memoised per slot DB across processes (a marker keyed on
  slot + schema sha1 + run token, cf. `support/run-token.ts`), or the AR suite
  sets the existing `SKIP_TEST_DATABASE_TRUNCATE` opt-out and the residual
  non-transactional writers are named.
- Any test file that still needs a clean table set gets it explicitly (fixtures /
  transactional rollback), not from a global per-file truncate; list the files
  that needed the explicit opt-in.
- `reconstructFromSchema` keeps its Rails-faithful behaviour for real callers
  (`db:test:prepare`); the change is in how the AR test bootstrap invokes it, not
  in `DatabaseTasks`.
- Before/after instrumented numbers for the phase on the sqlite lane, and a green
  full AR suite on all three lanes across repeated co-scheduled runs (row leakage
  between files is exactly the failure mode this guard was hiding).
