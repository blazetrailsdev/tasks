---
title: "statement-pool-cold-start-under-prepared-default"
status: done
updated: 2026-07-29
rfc: "0064-ar-test-infra-layout-fidelity"
cluster: null
deps: []
deps-rfc: []
est-loc: null
priority: 45
pr: 5586
claim: "2026-07-29T18:16:11Z"
assignee: "statement-pool-cold-start-under-prepared-default"
blocked-by: null
closed-reason: null
---

## Context

The advisory prepared-statements lane added by PR #5533
(`maria-prepared-tests` in `.github/workflows/ci.yml`, `ARCONN=mysql2` +
`MYSQL_PREPARED_STATEMENTS=1`) fails one test in
`packages/activerecord/src/adapters/abstract-mysql-adapter/statement-pool.trails.test.ts:38`,
`statement pool tracks distinct prepared queries`:

```text
- Expected: 1
+ Received: 2
```

at line 45, `expect(pool.length).toBe(1)` after two executions of the same
`SELECT ? AS n` with different binds. The test asserts the pool coalesces
repeats of one placeholder SQL into a single cached statement, then grows to 2
on a genuinely distinct SQL.

It passes on the default mysql lane because `preparedStatements` is off there
and the test flips it on per-test from a cold pool. Under
`MYSQL_PREPARED_STATEMENTS` the adapter is prepared-by-default for the whole
run, so the pool is already non-empty when the test's first assertion lands —
some earlier statement on the shared leased connection is still cached despite
the `afterEach` `disconnectBang()` (test file ll. 26-35). Whether the right
answer is a cold-pool guarantee in setup or a pool-keying fix needs
investigation; do not just relax the expected count.

## Acceptance criteria

- Root-cause which statement occupies the pool before the first assertion
  under the prepared default.
- Fix so the test asserts the same invariant on both lanes.
- Do NOT skip the test, weaken the assertion to a range, or rename it.
- Green under both `ARCONN=mysql2` and `ARCONN=mysql2
MYSQL_PREPARED_STATEMENTS=1`.
