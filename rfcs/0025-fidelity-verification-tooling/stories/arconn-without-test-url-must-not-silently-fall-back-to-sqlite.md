---
title: "ARCONN=postgres/mysql without *_TEST_URL must fail loudly, not silently run SQLite"
status: in-progress
updated: 2026-07-08
rfc: "0025-fidelity-verification-tooling"
cluster: null
deps: []
deps-rfc: []
est-loc: 40
priority: null
pr: 4768
claim: "2026-07-08T01:50:23Z"
assignee: "arconn-without-test-url-must-not-silently-fall-back-to-sqlite"
blocked-by: null
closed-reason: null
---

## Context

While fixing `unprepared-statement-materializes-lazy-transaction-pg-mysql`
(PR #4733), the target test appeared to pass on `ARCONN=postgresql` /
`ARCONN=mysql2` locally — but that was a **false green**. `ARCONN` only
drives which tests vitest includes (`vitest.config.ts:49,66`); the actual
backend is chosen by `test-database-config.ts:resolve()`, which sniffs
`PG_TEST_URL` / `MYSQL_TEST_URL` and **silently falls back to SQLite**
(`:memory:`) when neither is set. So `ARCONN=postgresql pnpm vitest ...`
without `PG_TEST_URL` runs the SELECTs against SQLite while pretending to be
the PG job — the real PG failure (no BEGIN emitted) only surfaced once a live
PG was wired via `PG_TEST_URL`. This footgun silently hides adapter-specific
divergences from every local run.

## Acceptance criteria

- When `ARCONN` is set to `postgresql`/`mysql2` but the matching
  `PG_TEST_URL`/`MYSQL_TEST_URL` is absent, the test bootstrap fails loudly
  (or emits a prominent warning) instead of silently resolving to SQLite —
  so `ARCONN=postgresql` can never quietly run on SQLite.
- SQLite runs (no `ARCONN`, or `ARCONN=sqlite3`) are unaffected.
- Covered by a focused test in `test-database-config.test.ts`.
