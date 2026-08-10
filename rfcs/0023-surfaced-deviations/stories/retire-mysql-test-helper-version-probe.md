---
title: "Retire the MySQL test-helper module-load VERSION() probe in favour of adapter predicates"
status: closed
updated: 2026-08-09
rfc: "0023-surfaced-deviations"
cluster: null
deps: []
deps-rfc: []
est-loc: 120
priority: null
pr: null
claim: null
assignee: null
blocked-by: null
closed-reason: "Not a Rails-fidelity convergence: a trails test-helper module-load probe. It touches no ported code path and moves no ported behavior toward Rails."
---

## Context

Surfaced while shipping #5537 (`retire-describe-if-mysql-reachability-probe`),
which deleted `describeIfMysql` and moved the last 8 MySQL suites onto
`describeIfMysqlAdapter`. That removed the probe's _suite-selection_ role but
deliberately left its _version-reading_ role in place, because the `supports*`
constants had no other source. This story retires that remainder.

`packages/activerecord/src/adapters/abstract-mysql-adapter/test-helper.ts`
still runs a module-load `SELECT VERSION()` over a throwaway `mysql2`
connection (`checkMysql()`), and derives five module-scope constants from it:

- `isMariaDb`, `mysqlVersion`
- `supportsOptimizerHints`, `supportsDefaultExpression`, `supportsExpressionIndex`

Rails has no such probe. It reads every one of these off the _connection_:

- `supports_optimizer_hints?` / `supports_expression_index?` are
  AbstractMysqlAdapter predicates
  (`vendor/rails/activerecord/lib/active_record/connection_adapters/abstract_mysql_adapter.rb:104`).
- `supports_default_expression?` is
  `vendor/rails/activerecord/test/support/adapter_helper.rb:23`.
- `mariadb?` is called on the leased connection directly — e.g.
  `defaults_test.rb:103`
  (`current_adapter?(:Mysql2Adapter, :TrilogyAdapter) && !ActiveRecord::Base.lease_connection.mariadb?`).

Now that every consumer suite rides the ambient `Base.connection`, the
adapter already knows all of this by the time the suites run, so the probe is
a trails invention duplicating adapter state.

Two concrete costs:

1. **A second connection on every lane.** `checkMysql()` runs at module load in
   every worker that imports the helper — including the sqlite and PG lanes,
   where it connects, fails, and is swallowed by the `catch`.
2. **Module-scope constants can't see the leased adapter.** Being resolved at
   import time, they are frozen before `fixtures()` establishes the connection,
   which is why `mysql-explain.test.ts` reads the module `isMariaDb` while
   computing everything else from `adapter.databaseVersion` in a `beforeAll` —
   two sources for one fact.

Note `MYSQL_TEST_URL` is _not_ in scope: it has ~13 legitimate callers that
deliberately build a second, differently configured adapter (non-strict
`sql_mode`, `ANSI_QUOTES`, `statementLimit`, a socket the retry loop tears
down). It only loses its use as the probe's connection string.

## Acceptance criteria

- [ ] `supportsOptimizerHints` / `supportsDefaultExpression` /
      `supportsExpressionIndex` resolve from the leased adapter's own
      predicates rather than a module-load probe. Prefer porting the missing
      adapter predicates where they don't exist yet, so the test helper reads
      them the way Rails does.
- [ ] `isMariaDb` / `mysqlVersion` consumers read `mariadb` /
      `databaseVersion` off the leased adapter. `mysql-explain.test.ts` ends up
      with one source for the MariaDB check, not two.
- [ ] `checkMysql()` and its module-load `SELECT VERSION()` are deleted — no
      lane opens a throwaway connection at import time.
- [ ] `MYSQL_TEST_URL` survives for the second-adapter callers.
- [ ] `expression_index` in `support/supports.ts` keeps working (it currently
      sources `supportsExpressionIndex`; it cannot be a static adapterType
      table since the mysql lane may be MySQL 8 or the MariaDB CI stand-in).
- [ ] CI green on all three adapters; `pnpm parity:test` gate-mismatch stays 0.
