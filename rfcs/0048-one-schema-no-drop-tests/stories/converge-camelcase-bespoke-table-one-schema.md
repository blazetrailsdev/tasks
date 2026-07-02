---
title: "Make CamelCase quoted-identifier tests create+drop their own table so they pass under one-schema (PG relation-missing)"
status: done
updated: 2026-07-02
rfc: "0048-one-schema-no-drop-tests"
cluster: null
deps: []
deps-rfc: []
est-loc: 120
priority: 1
pr: 4366
claim: "2026-07-02T02:19:59Z"
assignee: "converge-camelcase-bespoke-table-one-schema"
blocked-by: null
closed-reason: null
---

## Context

Under one-schema, PG CI surfaces `StatementInvalid: relation "CamelCase" does not
exist` (error code 42P01, at `postgresql-adapter.ts:1400`). Observed on the #4246
one-schema CI run (the abandoned spike), but it is a genuine one-schema deviation
that will recur on the `existing-db-schema-rc` burndown. `CamelCase` is a
deliberately NON-canonical table whose whole purpose is to exercise quoted /
capital-letter identifier handling — it cannot simply become canonical without
losing the thing under test. Two call sites:

- `packages/activerecord/src/schema-dumper.test.ts:93` — "schema dump includes
  camelcase table name" asserts the dump contains `createTable("CamelCase"`.
  `standardDump()` introspects tables and queries `CamelCase`; under one-schema
  the table is never created (its `defineSchema` shape no-ops), so introspection
  hits the missing relation. This file is already excluded and partly covered by
  `converge-schema-dumper-bespoke-shapes-one-schema` — coordinate, don't dup.
- `packages/activerecord/src/adapters/postgresql/postgresql-adapter.test.ts:224` —
  "primary key works tables containing capital letters" creates `CamelCase` via
  raw `adapter.exec(CREATE TABLE ...)` and drops it in `finally`. This file was
  dropped from `one-schema-exclude.json` on a SQLITE-only isolated probe; the PG
  lane may still fail it (isolated-pass ≠ PG-in-suite). Verify under PG one-schema
  and re-add to the exclude if it fails.

## Acceptance criteria

- The CamelCase tests pass under one-schema on ALL adapters (sqlite + PG + mysql):
  give the CamelCase table a real create+drop within the test (raw DDL / `force`
  DDL through `define-schema.ts:589`) so it exists when introspected/dumped,
  rather than relying on a no-op'd `defineSchema` — it stays a non-canonical,
  self-created-and-torn-down table (do NOT add it to canonical `TEST_SCHEMA`).
- `schema-dumper.test.ts` "schema dump includes camelcase table name" and
  `postgresql-adapter.test.ts` "primary key works tables containing capital
  letters" both green under `AR_ONE_SCHEMA=1` on the PG lane.
- If `postgresql-adapter.test.ts` fails PG one-schema, re-add it to
  `eslint/one-schema-exclude.json` in the same PR that lands the fix (net zero or
  negative exclude entries).
- No test renames. Coordinate with `converge-schema-dumper-bespoke-shapes-one-schema`.
