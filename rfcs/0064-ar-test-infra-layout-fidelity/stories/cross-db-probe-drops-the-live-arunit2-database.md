---
title: "Stop the MySQL cross-database probe from dropping the live arunit2 database"
status: done
updated: 2026-07-30
rfc: "0064-ar-test-infra-layout-fidelity"
cluster: null
deps: []
deps-rfc: []
est-loc: 90
priority: null
pr: 5645
claim: "2026-07-30T20:57:23Z"
assignee: "cross-db-probe-drops-the-live-arunit2-database"
blocked-by: null
closed-reason: null
---

## Context

`adapter.test.ts`'s "not specifying database name for cross database selects"
(MySQL) does `DROP DATABASE IF EXISTS` + `CREATE DATABASE` on `ARUNIT_DATABASE`
and `ARUNIT2_DATABASE`, then drops both again in its `finally`
(`packages/activerecord/src/adapter.test.ts`).

Since #5414, `ARUNIT2_DATABASE` is not a throwaway: it is the worker's real
second database, which `ARUnit2Model` holds a pool on for the whole run. The
test now calls `provisionSecondDatabase()` in its `finally` to put it back. That
works but is a coupling nobody would guess: a probe in one file silently
destroys and rebuilds global state another file depends on.

Rails has no such collision — its arunit2 is a real database the probe simply
references (`ARTest.test_configuration_hashes`), never drops.

## Acceptance criteria

- The probe stops dropping the live arunit2 database, or the coupling is made
  explicit and unmissable rather than a `finally` call in an unrelated test.
- The MySQL lane still exercises a genuine cross-database select against two
  config-derived database names.
