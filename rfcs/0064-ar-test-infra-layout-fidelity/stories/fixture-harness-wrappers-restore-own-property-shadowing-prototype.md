---
title: "Fixture harness wrappers restore adapter methods as own properties, silently shadowing prototype spies"
status: done
updated: 2026-08-09
rfc: "0064-ar-test-infra-layout-fidelity"
cluster: null
packages: []
deps: []
deps-rfc: []
est-loc: 60
priority: null
pr: 6280
claim: "2026-08-09T14:59:36Z"
assignee: "fixture-harness-wrappers-restore-own-property-shadowing-prototype"
blocked-by: null
closed-reason: null
---

## Context

Surfaced while shipping `mysql-ddl-implicit-commit-escapes-the-fixture-transaction-pin`
(PR #6277).

`withTransactionalFixtures` wraps adapter methods per test in two places —
`recordDdlTouchedTables` and `guardMysqlImplicitCommit`
(`packages/activerecord/src/test-fixtures/with-transactional-fixtures.ts`) —
and both restore with `target[method] = original` rather than
`delete target[method]`. `target` is the adapter **instance**, so after the
first test in a file, `execute` / `executeMutation` / `internalExecQuery` are
own properties of the pooled adapter permanently, shadowing the prototype for
the rest of the run.

The cost is silent: a test that spies by patching
`Object.getPrototypeOf(Base.connection)` never fires, its recording array stays
empty, and the assertion passes **vacuously**. This was hit for real while
writing the negative regression test in PR #6277 — the first version passed
against deliberately-broken code and only the deliberate baseline check caught
it. Any future harness test that spies on a prototype is exposed to the same
false green.

Rails has no analogue to lose: it wraps nothing here. `setup_fixtures` /
`teardown_fixtures` (`vendor/rails/activerecord/lib/active_record/test_fixtures.rb:113`,
`:146`) pin and unpin the pool and touch no adapter method, and its DDL methods
need no schema-cache recording because `create_table` / `drop_table` clear the
cache themselves (`abstract/schema_statements.rb:306,542`). The wrappers are
trails-only harness machinery, so the restore should simply leave no trace.

## Converged shape

Have both restore closures `delete target[method]` when the method was
inherited (capture `Object.prototype.hasOwnProperty.call(target, method)` at arm
time and restore the own value only if there was one). The two restore closures
are three lines each.

## Acceptance criteria

- [ ] Both `recordDdlTouchedTables` and `guardMysqlImplicitCommit` leave the
      adapter with no own property for a method they found on the prototype.
- [ ] A test asserts the adapter has no own `executeMutation` after a
      transactional test tears down, and that a prototype-level spy installed
      afterwards does fire — red on baseline.
- [ ] SQLite, PostgreSQL and MySQL/MariaDB lanes green.
