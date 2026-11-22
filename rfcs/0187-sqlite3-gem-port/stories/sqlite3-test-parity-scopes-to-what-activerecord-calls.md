---
title: "sqlite3: parity:test counts only the gem tests for methods activerecord calls"
status: in-progress
updated: 2026-11-22
rfc: "0187-sqlite3-gem-port"
cluster: findings
packages: ["sqlite3", "scripts"]
deps: []
deps-rfc: []
est-loc: 120
priority: null
pr: trails#10594
claim: "2026-11-22T20:24:13Z"
assignee: "sqlite3-better-sqlite3-and-expo-engines-honor-strict"
blocked-by: null
closed-reason: null
---

## Context

`pnpm parity:test --package sqlite3` on origin/main (23d8807ff1) prints `52/328 tests (15.9%) | 3/21 files`, with 0 skips. `sqlite3-gem-tests-enroll-in-parity-test` (done, trails#10449) enrolled the package and ported tests under `test_database.rb`, `test_statement.rb` and `test_pragmas.rb`, but its second criterion did not land: the 18 other gem test files under `vendor/sqlite3/v2.6.0/test/` are not `unported-files` rows, and the missing cases in the enrolled files are not skips. The RFC § "Scoring" rule (owner, 2026-10-08) is that the denominator is what activerecord calls. This story applies that rule to `parity:test`, the way `sqlite3-score-only-what-activerecord-calls` applies it to `parity:api`.

Missing files today: `test_backup.rb` (2), `test_collation.rb` (4), `test_database_flags.rb` (10), `test_database_readonly.rb` (3), `test_database_readwrite.rb` (4), `test_database_uri.rb` (3), `test_discarding.rb` (5), `test_encoding.rb` (15), `test_integration.rb` (67), `test_integration_aggregate.rb` (17), `test_integration_open_close.rb` (3), `test_integration_pending.rb` (4), `test_integration_resultset.rb` (18), `test_integration_statement.rb` (28), `test_resource_cleanup.rb` (2), `test_result_set.rb` (2), `test_sqlite3.rb` (6), `test_statement_execute.rb` (3).

## Acceptance criteria

- [ ] Each gem test file is classified against the RFC § "The surface" table, which lists the methods `sqlite3_adapter.rb` and `sqlite3/*.rb` call. Open flags (`READONLY`, `READWRITE`, `CREATE`), `strict` and `default_transaction_mode` count, because the adapter's `new_client` passes them.
- [ ] Each file that tests no such method is an `unported-files` row with the reason "not called by activerecord".
- [ ] In each enrolled or in-scope file, a case for a method activerecord does not call is a skip with the same reason.
- [ ] The cases that remain in scope are listed in the PR body by file. `sqlite3-test-port-the-in-scope-gem-cases` ports them.
- [ ] `pnpm parity:test --package sqlite3` before and after are in the PR body. The `parity:test` delta for every other package is zero.

## Verification

```bash
pnpm parity:test --package sqlite3 --missing && pnpm vitest run scripts/
```
