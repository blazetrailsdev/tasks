---
title: "pg-adapter-test-aftereach-connect-hook-timeout"
status: done
updated: 2026-08-08
rfc: "0061-ci-failures"
cluster: null
packages: []
deps: []
deps-rfc: []
est-loc: null
priority: null
pr: 6256
claim: "2026-08-08T18:16:03Z"
assignee: "pg-adapter-test-aftereach-connect-hook-timeout"
blocked-by: null
closed-reason: null
---

> Rehomed from `0028-ci-cost-optimization` when that RFC was closed; scope unchanged.

## Context

Re-measurement of `pg-maria-adapter-unique-flake-burndown-round-2`'s premise,
taken 2026-08-07 over the 399 completed `pull_request` `ci.yml` runs in the
window 2026-08-05T13:17Z - 2026-08-07T18:30Z (~53 h). Method: for every run
where the SQLite, PG and MariaDB AR jobs all reached a terminal conclusion,
count the runs that failed on PG and/or MariaDB but NOT on SQLite.

**Result: 9 adapter-unique failures over 125 tri-adapter runs = 7.2%**, against
round 2's 9.7% (12/124) baseline.

But the composition has changed, and that is the finding that matters. Round 2
observed "only 1 of those 12 touched adapter-ish paths, so these are
environmental / shared-DB collisions rather than real adapter regressions." In
this window it is the other way round — 8 of the 9 are real branch regressions:

- `pg-schema-statements-abstract-signature-divergences` (runs 31048981170,
  31049993717, 31058825999) - adapter work, MariaDB shards.
- `datetime-sf-is-a-number-not-a-rational` (31197166590, 31198502602, 31200048295) - three consecutive runs, both MariaDB shards, deterministic.
- `date-assertion-value-mark-vs-temporal-returns` (31064051929) - both shards.
- `bundle-time-instant-datetime-utc` (31110922811) - `ER_TRUNCATED_WRONG_VALUE`,
  `Incorrect time value: '[object Object]' for ... topics.bonus_time`: a
  Temporal value reaching the mysql2 driver unformatted. Branch bug.

Both-shards-failing and repeating across re-runs are the tells; none of these
is a flake.

The one genuinely environmental instance:

- `datetime-to-s-drops-the-time-of-day` (31141563735), PG-only, both shards.
  `Error: Hook timed out in 30000ms.` immediately after
  `postgresql-adapter.test.ts > PostgreSQLAdapterTest > raise error when cannot
translate exception`. That test is
  `await expect(adapter.execute(null)).rejects.toBeInstanceOf(TypeError)` on an
  adapter that has never connected, so the `afterEach`
  (postgresql-adapter.test.ts:119-128) has to establish a fresh connection
  before its `DROP TABLE IF EXISTS ex, ex2 CASCADE` — a connect that the 30 s
  hook budget does not survive under load.

So the flake rate proper is 1/125 = 0.8%. Intervening work has already burned
the class down: PR #5986 (arunit2 siblings under their own run token), PR #5998
(i18n gate isolation pinned to unit-tests), PR #5884 (PG advisory lock ids),
PRs #5720 / #5685 (arunit2 table/pool isolation), plus the per-worker `applySlot`
database suffix, which is why `ex` / `ex2` no longer collide across workers.

## Acceptance criteria

- [ ] The PG `afterEach` connect-to-clean-up path in
      `packages/activerecord/src/adapters/postgresql/postgresql-adapter.test.ts`
      no longer needs a fresh connection for a test that never opened one
      (drop `ex` / `ex2` only when the test created them, or reuse the probe
      connection), so `raise error when cannot translate exception` cannot time
      its hook out.
- [ ] No blanket retry is added (see
      `remove-pg-mysql-test-retry-after-flake-burndown`).
- [ ] Re-measure over a comparable window and record the adapter-unique rate
      alongside the 9.7% / 7.2% figures above.
