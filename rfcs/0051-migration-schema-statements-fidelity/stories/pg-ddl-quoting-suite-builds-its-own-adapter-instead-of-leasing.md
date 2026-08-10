---
title: "TableDefinition#toSql default quoting builds a PostgreSQLAdapter from a URL instead of leasing"
status: done
updated: 2026-08-08
rfc: "0051-migration-schema-statements-fidelity"
cluster: null
packages: []
deps: []
deps-rfc: []
est-loc: 140
priority: null
pr: 6238
claim: "2026-08-08T15:03:58Z"
assignee: "pg-ddl-quoting-suite-builds-its-own-adapter-instead-of-leasing"
blocked-by: null
closed-reason: null
---

## Context

PR #6217 retired `support/schema-conn.ts` and moved ~107 DDL-rendering call sites
onto `ActiveRecord::Base.lease_connection`, which is what Rails' own tests hand
`SchemaCreation.new` / `TableDefinition#initialize`
(`vendor/rails/activerecord/test/cases/adapter_test.rb`,
`vendor/rails/activerecord/test/cases/migration/columns_test.rb`). One site of
the same class was left standing because it is gated differently:

`packages/activerecord/src/connection-adapters/postgresql/schema-definitions.test.ts`
— `describeIfPg("TableDefinition#toSql default quoting")` builds its own adapter
in `beforeAll` and closes it in `afterAll`:

```ts
beforeAll(() => {
  conn = new PostgreSQLAdapter(PG_TEST_URL);
});
afterAll(() => {
  conn.disconnect();
});
```

Rails has no test that constructs an adapter from a URL. Its PostgreSQL suites
are `ActiveRecord::PostgreSQLTestCase`, gated on
`current_adapter?(:PostgreSQLAdapter)`, riding `Base.lease_connection`.

The blocker is the gate, not the construction. `describeIfPg`
(`support/describe-if-pg.ts`) is a **server probe** — it opens a `pg.Client`
against `PG_TEST_URL` at module load and runs wherever a PostgreSQL server
answers, including the sqlite and mysql2 lanes, where `Base.connection` is not
PostgreSQL. A suite under it therefore cannot lease; it must bring its own
adapter. PR #6217 added `describeIfPostgresqlAdapter`
(`support/describe-if-postgresql-adapter.ts`, the port of
`current_adapter?(:PostgreSQLAdapter)`) as the gate a leasing suite needs, and
registered it in `scripts/test-compare/gates.ts`.

## Converged shape

Move this describe (and any sibling `describeIfPg` block whose body is a plain
`Base.connection` interaction rather than a genuine cross-lane server probe) onto
`describeIfPostgresqlAdapter` + `Base.leaseConnection()`, deleting the
`new PostgreSQLAdapter(PG_TEST_URL)` / `disconnect()` pair. The assertion —
that a default containing a doubled single-quote round-trips through
`SchemaCreation` — is about the adapter's quoting, which the leased connection
provides.

Audit the remaining `describeIfPg` users while here: each is either (a) a
leasing suite mis-gated on the probe, which converges as above, or (b) a
deliberate cross-lane probe, which stays. Record which is which so the
distinction stops being re-derived — this is the third PR to hit it.

Do NOT widen `describeIfPg`; the probe has real users
(`pgAvailable` / `pgServerVersion` / `pgHasHintPlan` are read elsewhere).

## Acceptance criteria

- [ ] `TableDefinition#toSql default quoting` leases the ambient connection under
      `describeIfPostgresqlAdapter`; no `new PostgreSQLAdapter(PG_TEST_URL)` in
      that file.
- [ ] No test renamed.
- [ ] Every surviving `describeIfPg` block is one whose body genuinely needs the
      cross-lane probe.
- [ ] `pnpm parity:test` delta non-negative (the gate change is visible to the
      extractor — both wrappers are registered).
- [ ] Green on sqlite (file lane), `sqlite3_mem`, PG and MariaDB.
