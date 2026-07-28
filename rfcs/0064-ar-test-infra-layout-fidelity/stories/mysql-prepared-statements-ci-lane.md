---
title: "Exercise the mysql lane with MYSQL_PREPARED_STATEMENTS in CI"
status: ready
updated: 2026-07-28
rfc: "0064-ar-test-infra-layout-fidelity"
cluster: null
deps: []
deps-rfc: []
est-loc: 40
priority: null
pr: null
claim: null
assignee: null
blocked-by: null
closed-reason: null
---

## Context

PR #5521 made the mysql2 `arunit` / `arunit2` entries resolve
`preparedStatements` from `MYSQL_PREPARED_STATEMENTS`
(`packages/activerecord/src/support/config.ts` `mysqlPreparedStatements`,
consumed by the mysql2 builder in `support/connection.ts`), matching
`vendor/rails/activerecord/test/config.example.yml:7-11,27-31`.

The toggle now works, but **no CI job sets the var**, so the prepared-statement
path of the mysql lane is never exercised end to end. `mysql2-adapter.ts:357`
and `abstract-adapter.ts:2566` both branch on `preparedStatements`, and that
branch is currently only covered by unit tests, never by a real suite run
against MySQL. Rails' own CI runs a `mysql2_prepared` lane for exactly this
reason (`.github/workflows/rails-ci.yml` in the vendored tree runs the AR suite
with `MYSQL_PREPARED_STATEMENTS=true`).

## Acceptance criteria

- A CI job (or a matrix dimension on the existing mysql lane) runs the
  activerecord suite with `MYSQL_PREPARED_STATEMENTS` set.
- Any failures the prepared path surfaces are either fixed or registered as
  their own stories — do not silence them by skipping tests.
- Decide and document whether the new lane is required-to-merge or advisory;
  runner budget is the constraint (`.github/workflows/ci.yml`).
