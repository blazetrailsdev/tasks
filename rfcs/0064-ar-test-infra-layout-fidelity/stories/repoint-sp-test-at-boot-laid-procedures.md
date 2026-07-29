---
title: "sp.test.ts still creates the stored procedures boot now lays"
status: done
updated: 2026-07-29
rfc: "0064-ar-test-infra-layout-fidelity"
cluster: null
deps: []
deps-rfc: []
est-loc: 30
priority: null
pr: 5552
claim: "2026-07-29T00:25:47Z"
assignee: "repoint-sp-test-at-boot-laid-procedures"
blocked-by: null
closed-reason: null
---

## Context

PR #5534 ported `mysql2_specific_schema.rb:66-82`, so the mysql lane now creates
the `ten()` and `topics(IN num INT)` stored procedures at boot in
`loadMysql2SpecificSchema`
(`packages/activerecord/src/support/load-schema-helper.ts`).

`packages/activerecord/src/adapters/abstract-mysql-adapter/sp.test.ts:16-29`
still creates both procedures itself in `beforeAll` and drops them in cleanup.
Rails' `vendor/rails/activerecord/test/cases/adapters/abstract_mysql_adapter/sp_test.rb`
has no such setup at all — its `setup` only leases the connection and
version-skips; the procedures come from the schema file. This is the same
inline-vs-boot repointing PR #5534 did for `binary_fields`, `key_tests` and
`collation_tests`; the procedures were left because the story's acceptance
criteria named only those three tables.

Nothing is failing today (the inline `CREATE` is preceded by
`DROP PROCEDURE IF EXISTS`, so it is idempotent against the boot-laid pair), but
the teardown drops procedures that are now part of the boot schema, and
`support/drop-all-tables.ts` shields tables only — it has no notion of
procedures, so nothing recreates them for a later file in the same worker.

## Acceptance criteria

- `sp.test.ts` drops its `beforeAll` procedure creation and its procedure
  teardown, riding the boot-laid `ten()` / `topics()` as Rails' `sp_test.rb`
  does.
- Test names are unchanged.
- Verified on the mysql lane (`ARCONN=mysql2`), including a run where
  `sp.test.ts` executes after another mysql file in the same worker.
