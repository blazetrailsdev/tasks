---
title: "pg-adapter-test-port-surfaced-deviations"
status: done
updated: 2026-07-07
rfc: "0056-adapter-type-column-reflection-fidelity"
cluster: null
deps: []
deps-rfc: []
est-loc: null
priority: 32
pr: 4725
claim: "2026-07-07T03:33:35Z"
assignee: "pg-adapter-test-port-surfaced-deviations"
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

3. **Adapter-level tests lack ambient fixtures.** Rails `test_serial_sequence` /
   `test_default_sequence_name` exercise the loaded `accounts` fixture and assert
   `"public.accounts_id_seq"`. trails adapter tests have no ambient fixtures, and
   recreating the shared canonical `accounts` in the parallel PG lane would
   corrupt sibling suites, so the port exercises the identical sequence-name
   derivation against the ephemeral `ex` table (`"public.ex_id_seq"`). Fix:
   provide a fixture-loading path for adapter-level PG tests so these can run
   against the real `accounts` table as Rails does. (Test-infra convergence, not
   an impl behavior gap.)

## Acceptance criteria

- [ ] Each deviation above is either converged to Rails behavior (with the
      deferred assertion restored in postgresql-adapter.test.ts) or explicitly
      ratified with rationale.
- [ ] No test-name changes; `test:compare` delta non-negative.
