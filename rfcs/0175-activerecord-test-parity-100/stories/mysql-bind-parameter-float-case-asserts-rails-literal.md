---
title: "activerecord: MySQL bind-parameter float case passes a Float and asserts Rails' '0.0'"
status: done
updated: 2026-10-14
rfc: "0175-activerecord-test-parity-100"
cluster: null
packages: []
deps: []
deps-rfc: []
est-loc: 10
priority: null
pr: trails#8901
claim: "2026-10-14T15:18:15Z"
assignee: "mysql-bind-parameter-float-case-asserts-rails-literal"
blocked-by: null
closed-reason: null
---

## Context

From trails PR 8872, which converged the float case in the SQLite and PostgreSQL bind-parameter
suites by passing a boxed `new Number(0.0)` (the Float carrier `rbObjAsString` renders as `0.0`).
The MySQL suite was left as it was.

`packages/activerecord/src/adapters/abstract-mysql-adapter/bind-parameter.test.ts`
"where with float for string column using bind parameters" asserts
`assertQuotedAs("'0'", 0.0)`. Rails asserts `assert_quoted_as "'0.0'", 0.0`
(`vendor/rails/v8.0.2/activerecord/test/cases/adapters/abstract_mysql_adapter/bind_parameter_test.rb:59-61`).
A bare JS `0.0` is the Integer `0`, so the case is byte-identical to the integer case above it.

`castBoundValue` (`packages/activerecord/src/connection-adapters/mysql/quoting.ts`) already sends a
boxed `Number` through `toS`, so the converged test is expected to pass with no source change; that
was not run against MariaDB.

## Acceptance criteria

- [ ] The test passes `new Number(0.0)` and asserts Rails' `'0.0'`; the test name is unchanged.
- [ ] If `castBoundValue` does not render `'0.0'` for a boxed Number, it is converged to
      `abstract_mysql_adapter.rb`'s `cast_bound_value` Float arm.
- [ ] Green on the MariaDB lane.
