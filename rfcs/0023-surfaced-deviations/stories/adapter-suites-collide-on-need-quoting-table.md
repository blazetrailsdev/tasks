---
title: "Adapter test suites collide on shared 1_need_quoting table when co-scheduled"
status: ready
updated: 2026-07-19
rfc: "0023-surfaced-deviations"
cluster: null
deps: []
deps-rfc: []
est-loc: 50
priority: null
pr: null
claim: null
assignee: null
blocked-by: null
closed-reason: null
---

## Context

`1_need_quoting` is created by more than one adapter test file, and the files
run in parallel against a single database, so whichever loses the race dies at
setup:

- MySQL: `ER_TABLE_EXISTS_ERROR` / errno 1050 —
  ``CREATE TABLE `1_need_quoting` ...``
- PostgreSQL: `23505` on `pg_type_typname_nsp_index`,
  `Key (typname, typnamespace)=(1_need_quoting, 2200) already exists`

Reproduced during PR #4956 while verifying `captureSql` callers under
`ARCONN=mysql2` / `ARCONN=postgresql`:
`adapters/abstract-mysql-adapter/optimizer-hints.test.ts` +
`adapters/abstract-mysql-adapter/active-schema.test.ts` /
`case-sensitivity.test.ts`, and the PostgreSQL pair
`adapters/postgresql/active-schema.test.ts` + `optimizer-hints.test.ts`.

Confirmed pre-existing on `main` and unrelated to #4956: each file passes
alone against a fresh database (`case-sensitivity` 7/7, mysql `optimizer-hints`
1/1, pg `active-schema` 6/6); only the co-scheduled run fails. Not a captureSql
behaviour change — verified by baselining the same files against `origin/main`.

## Acceptance criteria

- The colliding suites no longer share one unqualified `1_need_quoting` table
  when co-scheduled (drop-if-exists on setup, or per-file isolation consistent
  with how the canonical schema handles shared tables).
- Running the MySQL adapter suites together under `ARCONN=mysql2`, and the
  PostgreSQL pair together under `ARCONN=postgresql`, passes repeatedly against
  a non-fresh database.
- No test name changes.
