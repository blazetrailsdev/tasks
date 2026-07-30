---
title: "Stamp the run token into PG/MySQL slot database names and advisory-lock keys"
status: done
updated: 2026-07-30
rfc: "0028-ci-cost-optimization"
cluster: null
deps: []
deps-rfc: []
est-loc: null
priority: null
pr: 5638
claim: "2026-07-30T13:13:01Z"
assignee: "stamp-run-token-into-pg-mysql-slot-databases"
blocked-by: null
closed-reason: null
---

## Context

An audit of test-DB isolation (2026-07-29) confirmed that **within one vitest
run** every worker gets its own database on all four lanes — PG/MySQL via the
advisory-lock slot suffix, SQLite via a per-worker template clone. Verified
empirically (4 forks, 4 probe files) on sqlite3, sqlite3_mem, postgresql and
mysql2.

The gap is **across concurrent runs on one shared server**. The PG/MySQL slot
database names carry no per-run discriminator:

- `packages/activerecord/src/support/template-global-setup.ts:~185` (PG) and
  `:~245` (MySQL) name each slot DB `slot === 1 ? settings.database :
`${settings.database}_${slot}``— i.e.`activerecord_unittest`,
`activerecord_unittest_2`, … with no run token.
- Both loops issue `DROP DATABASE IF EXISTS` immediately followed by
  `CREATE DATABASE` for **every** slot in `1..slotCount()`.
- `packages/activerecord/src/support/config.ts:143-152` (`applySlot`) derives
  the same unstamped name in the workers from `AR_DB_SLOT`.

The advisory locks that hand out slots are **server-wide**, not
database-scoped (`pg_try_advisory_lock(N)` in
`packages/activerecord/src/test-setup-worker-db.ts:88-92`;
`GET_LOCK('ar_test_slot_N', 0)` at `:131-136`). So two concurrent runs against
the same PG/MySQL server share one slot namespace: run B's `globalSetup` DROPs
and recreates `activerecord_unittest_2..N` while run A's workers are actively
connected to them, and the two runs' workers compete for one pool of
`workers + 2` locks.

This is exactly the failure signature already documented in the
"isolated compose project for local PG/MySQL runs" note: suite-level failures
with zero failing assertions — `42P01 relation does not exist`, duplicate
`pg_type` keys, `Table 'x' already exists`,
`acquireAdvisorySlotMysql: all 6 GET_LOCK slots are held`. Today the only
mitigation is a hand-rolled per-agent `docker compose -p <slug>` stack on
edited ports, which every agent must remember to do and which several have
gotten wrong.

The SQLite lane already solves this correctly and is the model to copy: both
the template and the worker clone stamp a run token —
`ar-test-template-${runToken}.sqlite` and
`ar-test-worker-${runToken}-${slot}.sqlite`
(`packages/activerecord/src/support/sqlite-template.ts:~193,~215`), with
`sweepRunDbFiles(runToken)` reclaiming only that run's files. Two concurrent
SQLite runs in different worktrees therefore cannot collide, and the audit
confirmed distinct clone paths per worker.

CI is unaffected (each GitHub job gets its own service container), so this is
purely a local-developer/parallel-agent correctness and ergonomics fix.

## Acceptance criteria

- PG and MySQL slot database names carry a per-run discriminator, so two
  concurrent runs on the same server never name the same database. Reuse the
  existing `AR_TEST_RUN_TOKEN` (`RUN_TOKEN_ENV`) rather than inventing a second
  token; stamp it in `globalSetup` before workers fork so `applySlot` and the
  provisioning loops derive the identical name from one signal (keep the
  "derive from one signal, never rewrite a URL string" property that
  `support/config.ts` documents).
- The advisory-lock keys are likewise per-run, so a second concurrent run
  cannot exhaust the first run's slot pool: PG lock keys and MySQL
  `ar_gt_lock_*` names must be derived from the run token, not from the bare
  slot number.
- `globalSetup`'s `DROP DATABASE IF EXISTS` can only ever target databases
  belonging to its own run token. A regression test must fail on baseline by
  showing that a name from a _different_ run token is never dropped.
- Teardown removes the run's slot databases (the PG/MySQL analogue of
  `sweepRunDbFiles`), plus a stale-sweep for databases orphaned by killed runs
  older than the existing `STALE_DB_AGE_MS` cutoff, so repeated local runs do
  not accumulate `activerecord_unittest_*` databases on the server.
- `slot === 1` no longer aliases the bare `activerecord_unittest` base database
  if that is what makes two runs collide on the un-suffixed name — decide and
  document explicitly, since `applySlot` currently treats slot 1 as "the shared
  base database".
- Behaviour is unchanged for a single run: fork count, slot pool sizing
  (`support/ar-db-slots.ts`) and the `ar-db-forks-parity.test.ts` invariant all
  still hold, and `arunit2-config.ts`'s `_arunit2` suffixing still produces a
  distinct, correctly-named second database (mind the documented
  `activerecord_unittest_3` + `"2"` → `activerecord_unittest_32` trap).
- With the fix in place, two concurrent local PG runs (and two concurrent MySQL
  runs) against one server on default ports both pass, so the
  hand-rolled per-agent compose stack is no longer required for correctness.
- CI's postgres/maria jobs are unaffected (no workflow edit needed).
