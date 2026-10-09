---
title: "activerecord: captureSql is TestCase#capture_sql over SQLCounter, with execute stubbed in test setup"
status: blocked
updated: 2026-10-08
rfc: "0123-blocked-convergence-holding"
cluster: convergeable
packages: ["activerecord"]
deps: []
deps-rfc: []
est-loc: 600
priority: null
pr: null
claim: null
assignee: null
blocked-by: "parked by owner 2026-10-08: test-helper relocation across many call sites with no behaviour change; resume on an owner decision"
closed-reason: null
---

## Context

Split out of `activerecord-converge-test-infra-convergeable-receipts` (800 LOC ceiling): `captureSql` in
`packages/activerecord/src/testing/sql-capture.ts` is re-tagged `@noRailsEquivalent CONVERGEABLE` onto this
story. Its sibling `captureSqlAndBinds` already moved to `test-helpers/test-case.ts` with Rails' body.

Rails (`vendor/rails/v8.0.2/activerecord/test/cases/test_case.rb:90-100`):

```ruby
def capture_sql(include_schema: false)
  counter = SQLCounter.new
  ActiveSupport::Notifications.subscribed(counter, "sql.active_record") do
    yield
    if include_schema
      counter.log_all
    else
      counter.log
    end
  end
end
```

trails' `captureSql(fn, { includeSchema, stub })` differs three ways:

- It lives in `testing/sql-capture.ts`, a scored `lib/`-shaped path, where `capture_sql` is a method of
  `ActiveRecord::TestCase` (`test/cases/test_case.rb`, mirrored by `test-helpers/test-case.ts`). 35 files
  import it from the old path, about 200 call sites.
- Its body is a hand-rolled `Notifications.subscribe` filter, not `SQLCounter` (`testing/query-assertions.ts`).
- It takes an invented `stub` option (`installExecuteStub`, `StubbableAdapter`) that replaces the adapter's
  `execute` / `exec` for the duration of the block. Rails stubs `execute` in the test's own `setup`:
  `vendor/rails/v8.0.2/activerecord/test/cases/adapters/abstract_mysql_adapter/active_schema_test.rb:9-27`
  (with `with_real_execute`, `:192-205`, around the statements that must reach the server) and
  `vendor/rails/v8.0.2/activerecord/test/cases/adapters/postgresql/active_schema_test.rb:6-18`. The option has
  about 45 call sites in three files: `adapters/abstract-mysql-adapter/active-schema.test.ts`,
  `adapters/postgresql/active-schema.test.ts`, `adapters/postgresql/postgresql-adapter.trails.test.ts`.
  They run on the MariaDB and PostgreSQL lanes only.

## Acceptance criteria

- [ ] `captureSql` is defined in `test-helpers/test-case.ts` with the body of `test_case.rb:90-100` over `SQLCounter`; `testing/sql-capture.ts`, `installExecuteStub`, `StubbableAdapter` and the receipt are deleted, and the `eslint/no-explicit-any-src-exclude.json` row for the file goes with it.
- [ ] The three active-schema test files stub `execute` in `beforeEach` and restore it in `afterEach` as the Rails `setup` / `teardown` do, with `withRealExecute` where Rails has `with_real_execute`; no call site passes `stub`.
- [ ] `pnpm parity:api:extra:gate` stays rowless; the sqlite, postgres and mariadb lanes stay green.

## Verification

```bash
pnpm parity:api:extra:gate && pnpm parity:api:receipts:gate
```
