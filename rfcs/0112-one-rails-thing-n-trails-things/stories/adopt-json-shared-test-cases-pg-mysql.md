---
title: "adopt-json-shared-test-cases-pg-mysql"
status: done
updated: 2026-08-28
rfc: "0112-one-rails-thing-n-trails-things"
cluster: null
packages: []
deps: []
deps-rfc: []
est-loc: null
priority: null
pr: 7141
claim: "2026-08-27T23:27:55Z"
assignee: "adapter-default-timezone-is-a-config-read-not-the-rails-ivar"
blocked-by: null
closed-reason: null
---

## Context

`packages/activerecord/src/cases/json-shared-test-cases.ts` (added by
`port-json-shared-test-cases`, RFC 0112) ports Rails'
`vendor/rails/activerecord/test/cases/json_shared_test_cases.rb` as an
includable module, and the sqlite3 suite
(`packages/activerecord/src/adapters/sqlite3/json.test.ts`) draws from it.

The other two Rails suites that `include JSONSharedTestCases` are not yet
wired to it:

- `vendor/rails/activerecord/test/cases/adapters/postgresql/json_test.rb`
  (`PostgresqlJsonTest` / `PostgresqlJsonbTest`, `column_type` `:json` and
  `:jsonb`, plus its own `insert_statement_per_database`). trails'
  `packages/activerecord/src/adapters/postgresql/json.test.ts` is currently a
  bespoke, non-Rails suite that re-implements a few JSON cases against raw DDL.
- `vendor/rails/activerecord/test/cases/adapters/mysql2/json_test.rb`
  (`Mysql2JSONTest`). trails has no MySQL JSON suite at all.

The module already takes `columnType` and an optional
`insertStatementPerDatabase` host argument, which is exactly what those two
suites override.

## Acceptance criteria

- [ ] The PG JSON suite mirrors `postgresql/json_test.rb`: both the json and
      jsonb classes call `jsonSharedTestCases`, and the bespoke re-implemented
      cases are deleted rather than kept alongside.
- [ ] A MySQL JSON suite mirroring `mysql2/json_test.rb` calls it too.
- [ ] Any case the module cannot satisfy on those adapters is justified at the
      call site, not dropped.
