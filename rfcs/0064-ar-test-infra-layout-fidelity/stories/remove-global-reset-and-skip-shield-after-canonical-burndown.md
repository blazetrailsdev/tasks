---
title: "remove-global-reset-and-skip-shield-after-canonical-burndown"
status: done
updated: 2026-07-31
rfc: "0064-ar-test-infra-layout-fidelity"
cluster: null
deps:
  - drop-bespoke-tables-per-file-like-rails
deps-rfc: []
est-loc: null
priority: null
pr: 5719
claim: "2026-07-31T16:24:04Z"
assignee: "remove-global-reset-and-skip-shield-after-canonical-burndown"
blocked-by: null
closed-reason: null
---

## Context

`cases/helper.ts:75-77` runs a global `beforeEach` that calls
`resetTestAdapterState()` (`packages/activerecord/src/test-adapter.ts:257`)
before every AR test unless a suite holds the skip shield
(`packages/activerecord/src/support/skip-global-reset.ts`).

Rails has no counterpart. `TestFixtures#teardown_fixtures`
(`vendor/rails/activerecord/lib/active_record/test_fixtures.rb:146-158`)
rolls the per-test transaction back and clears active connections — it never
truncates or drops tables between tests, because every suite rides the single
schema `db:test:prepare` laid down.

trails needs the reset only because files that create bespoke, non-canonical
tables leak them into the shared worker DB, where the next file would see
them. `resetTestTables` DROPs every non-canonical table for exactly that
reason. So the reset — and the entire `skip-global-reset.ts` shield built to
opt out of it, including `skipGlobalResetForFile()` and the push/pop inside
`withTransactionalFixtures` — is downstream of the bespoke-table population,
which the canonical-schema burndown (RFC 0059 / the defineSchema north star)
is retiring.

## Acceptance criteria

- Once no test file creates non-canonical tables, delete the global
  `beforeEach` reset in `cases/helper.ts` and `resetTestAdapterState`'s
  between-test role.
- Delete `support/skip-global-reset.ts` (`pushSkipGlobalReset` /
  `popSkipGlobalReset` / `shouldSkipGlobalReset` / `skipGlobalResetForFile`)
  and the push/pop + trailing reset inside
  `test-fixtures/with-transactional-fixtures.ts`, leaving Rails'
  rollback-and-clear-connections teardown shape.
- Verify the remaining bespoke-table callers first; if any survive, scope this
  story to the survivors rather than partially removing the shield.
- No test-name or transactional-fixtures semantic changes.

## Measurement (2026-07-31, `measure-global-reset-sweep-before-removal`)

`resetTestTables` was instrumented to report every table it drops, and the full
AR suite was run on all three lanes with the report on. Only the global
between-test reset is measured: `resetTestAdapterState` opts in with
`{ measure: true }`, so the boot reset in `test-setup-dy.ts` (which drops boot
bookkeeping — `defaults`, on a worker recycled onto an already-used database)
and `resetTestTables`' own unit tests (which drop tables they created a line
earlier) are excluded by construction.

The swept set is the same on every lane:

Lanes are named by `ARCONN`; the report files are keyed by
`adapter.adapterName`, which is the shorter name.

| lane (`ARCONN`) | report files            | swept between tests    |
| --------------- | ----------------------- | ---------------------- |
| `sqlite3`       | `sweep-sqlite-*.json`   | `ar_internal_metadata` |
| `postgresql`    | `sweep-postgres-*.json` | `ar_internal_metadata` |
| `mysql2`        | `sweep-mysql-*.json`    | `ar_internal_metadata` |

No bespoke table, no view, no matview, no `schema_migrations` — nothing a test
created survived to the next test's `beforeEach`. The 164 non-canonical
`createTable()` calls counted in the old `blocked-by` note are all dropped by
their own file, so counting them overstated the sweep's remaining work: the
measurement is what the sweep actually does, and it is nothing but
`ar_internal_metadata`.

`ar_internal_metadata` is dropped every sweep because it is never boot-laid
(`BOOKKEEPING_TABLE_NAMES` in `support/drop-all-tables.ts` excludes it from the
snapshot), not because a test leaked it. That is the one thing removal has to
account for: migrator tests that expect it absent must create/clear it
themselves, the way Rails does.

Instrumentation is retained off-by-default behind `AR_SWEEP_REPORT=<dir>`
(`packages/activerecord/src/support/sweep-report.ts`) so the measurement can be
repeated after any change.
