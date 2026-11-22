---
title: "sqlite3: port the remaining in-scope gem tests (test_database, test_statement, test_integration_statement)"
status: ready
updated: 2026-11-22
rfc: "0187-sqlite3-gem-port"
cluster: findings
packages: ["sqlite3"]
deps: ["sqlite3-test-parity-scopes-to-what-activerecord-calls"]
deps-rfc: []
est-loc: 400
priority: null
pr: null
claim: null
assignee: null
blocked-by: null
closed-reason: null
---

## Context

After `sqlite3-test-parity-scopes-to-what-activerecord-calls` registers the out-of-scope gem test files and cases, the gem's tests for the methods activerecord calls still have to be ported. On origin/main (23d8807ff1), `test_database.rb` is 21/74, `test_statement.rb` is 23/50, and `test_integration_statement.rb` is 0/28 (`bind_params`, `columns`, `close`, `remainder`, `execute`). Also in scope are the cases in any flags, readonly or readwrite file that the scoping story keeps. `sqlite3-test-default-transaction-mode` already owns `test_default_transaction_mode`.

## Acceptance criteria

- [ ] Every in-scope case the scoping story's PR lists is ported under its Minitest name in `packages/sqlite3/test/test-*.test.ts`, line for line against the better-sqlite3 engine.
- [ ] `pnpm parity:test --package sqlite3` reports 100% of the non-skipped cases, and `pnpm parity:test:assertions` is clean for the package.
- [ ] If the scope is over about 400 LOC, split it into one story per file with `pnpm tasks new`.

## Verification

```bash
pnpm parity:test --package sqlite3 --missing && pnpm parity:test:assertions
```
