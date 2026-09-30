---
title: "activerecord: burn require-canonical-rebuild-exclude (17) and non-transactional-row-writes (9)"
status: ready
updated: 2026-09-30
rfc: "0175-activerecord-test-parity-100"
cluster: lint-registers
packages: ["activerecord"]
deps: []
deps-rfc: []
est-loc: 450
priority: null
pr: null
claim: null
assignee: null
blocked-by: null
closed-reason: null
---

## Context

Two test-infrastructure registers, both only-shrink:

- `eslint/require-canonical-rebuild-exclude.json` — `privateAdapter` (16) and
  `nonExecuting` (1) test files that mutate canonical tables without the rebuild guard:
- `adapter-prevent-writes.test.ts`
- `adapters/sqlite3/bind-parameter.test.ts`
- `adapters/sqlite3/sqlite3-adapter.test.ts`
- `adapters/sqlite3/transaction.test.ts`
- `connection-adapters/abstract/schema-statements-on-adapter.trails.test.ts`
- `connection-adapters/connection-handlers-sharding-db.test.ts`
- `connection-adapters/schema-cache.test.ts`
- `connection-adapters/sqlite3-adapter.transactions.trails.test.ts`
- `connection-adapters/sqlite3-introspection.trails.test.ts`
- `connection-adapters/sqlite3/quoting.trails.test.ts`
- `core.trails.test.ts`
- `database-statements.test.ts`
- `migration/exclusion-constraint.test.ts`
- `migration/unique-constraint.test.ts`
- `sqlite/libsql.trails.test.ts`
- `transactions.trails.test.ts`
- `connection-adapters/postgresql/schema-statements.trails.test.ts`
- `scripts/non-transactional-row-writes.json` — tests writing rows outside the transactional-fixture
  wrapper (a MySQL row-leak hazard, see memory "no teardown DELETE → rows leak on MySQL"):
- `adapters/postgresql/postgresql-adapter-perform-query.trails.test.ts`
- `adapters/sqlite3/sqlite3-adapter-perform-query.trails.test.ts`
- `connection-adapters/connection-handlers-multi-db.test.ts`
- `connection-adapters/connection-handlers-sharding-db.test.ts`
- `invertible-migration.test.ts`
- `migration/columns.test.ts`
- `migration/rename-table.test.ts`
- `support/drop-all-tables.trails.test.ts`
- `unconnected.test.ts`

## Acceptance criteria

- [ ] Each file uses `fixtures({ ... })` / the canonical rebuild the rule expects, or its Rails twin's own non-transactional setup, and leaves its register.
- [ ] Both registers are empty (and their registrations removed).
