---
title: "mysql2-adapter-nullpool-and-addreference-deviations"
status: in-progress
updated: 2026-07-04
rfc: "0056-adapter-type-column-reflection-fidelity"
cluster: null
deps: []
deps-rfc: []
est-loc: null
priority: null
pr: 4578
claim: "2026-07-04T23:07:06Z"
assignee: "mysql2-adapter-nullpool-and-addreference-deviations"
blocked-by: null
---

## Context

Surfaced while converging `mysql2-adapter.test.ts` to a faithful Rails port
(PR #4352, story converge-mysql2-adapter-rails-port). Two Rails test methods in
`vendor/rails/activerecord/test/cases/adapters/mysql2/mysql2_adapter_test.rb`
could not be ported faithfully because trails' adapter/pool surface diverges:

1. `test_connection_error` (rb:14) and `test_reconnection_error` (rb:21) assert
   `error.connection_pool` is an `ActiveRecord::ConnectionAdapters::NullPool`.
   A standalone trails adapter's `pool` getter
   (`packages/activerecord/src/connection-adapters/pool-config.ts` `get pool`)
   lazily constructs a real `ConnectionPool`, never a `NullPool`, so the pool
   assertion cannot be reproduced. The two cases are currently deferred (not
   ported) rather than bent.

2. The FK type-mismatch tests (rb:136–265) rely on Rails `add_reference`
   defaulting the reference column to `:bigint` and on `old_cars` having an
   integer PK. trails' `addReference`
   (`abstract/schema-statements.ts:629`) defaults `colType` to `"integer"`, and
   canonical `old_cars` (`test-helpers/test-schema.ts`) widens its PK to bigint.
   The port works around this by building the fixture tables via raw DDL with
   explicit Rails-matching PK types; converging the impl (addReference default
   bigint + old_cars integer PK) would let the tests ride canonical tables.

## Acceptance criteria

- [ ] Decide convergence path for NullPool: either give standalone adapters a
      NullPool by default (Rails-faithful) or document a ratified deviation, and
      port `connection_error` / `reconnection_error` into
      `mysql2-adapter.test.ts` with their pool assertions.
- [ ] Converge `addReference` default ref-column type to `:bigint` (Rails) and
      `old_cars` canonical PK to integer, then rewrite the FK type-mismatch
      tests to use `addReference` / `addForeignKey` against canonical tables.
- [ ] No bending of the Rails assertions; remove the corresponding tracked-
      deviation note from the converged test file header.
