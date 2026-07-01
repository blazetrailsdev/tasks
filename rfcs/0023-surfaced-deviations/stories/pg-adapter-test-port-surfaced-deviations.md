---
title: "pg-adapter-test-port-surfaced-deviations"
status: ready
updated: 2026-07-01
rfc: "0023-surfaced-deviations"
cluster: null
deps: []
deps-rfc: []
est-loc: null
priority: null
pr: null
claim: null
assignee: null
blocked-by: null
---

## Context

Surfaced while converging
`packages/activerecord/src/adapters/postgresql/postgresql-adapter.test.ts` to a
faithful port of
`vendor/rails/activerecord/test/cases/adapters/postgresql/postgresql_adapter_test.rb`
(PR #4359). Several deviations were fixed in that PR (pkAndSequenceFor
null-vs-`[pk, nil]` matching Rails' fallback-query semantics; INCLUDE-column
quote un-doubling; `indexExists` `valid:` option; `primaryKey` case-sensitive
resolution via `to_regclass(quote_ident(...))`). The following real impl gaps
were deferred with tracked notes in the test file header and should be converged
to Rails behavior:

1. **`indexExists` returns false for expression indexes.** Rails
   `test_expression_index` asserts
   `index_exists?("ex", "mod(id, 10), abs(number)", name: "expression") == true`.
   trails `indexExists` returns false, so the port asserts the index columns
   only and defers the `index_exists?` sub-assertion. Fix: match an expression
   index by name (Rails resolves by name when columns are an expression). Ref
   `connection-adapters/postgresql/schema-statements-class.ts` (indexes) and the
   `indexExists` path.

2. **Standalone-adapter errors carry a ConnectionPool, never NullPool.** Rails
   `test_connection_error` / `test_reconnection_error` assert
   `error.connection_pool` is a `NullPool` (and `test_serial_sequence` /
   `test_bad_connection_to_postgres_database` assert pool identity). A standalone
   trails adapter always carries a ConnectionPool, so those pool-identity
   assertions are omitted (only the translated error class is asserted). Shared
   with the mysql2 converge follow-up (same NullPool gap). Fix: expose a
   NullPool on errors raised before a real pool is established.

## Acceptance criteria

- [ ] Each deviation above is either converged to Rails behavior (with the
      deferred assertion restored in postgresql-adapter.test.ts) or explicitly
      ratified with rationale.
- [ ] No test-name changes; `test:compare` delta non-negative.
