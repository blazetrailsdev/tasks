---
title: "raises-assertion-compares-exception-class"
status: draft
updated: 2026-10-20
rfc: "0025-fidelity-verification-tooling"
cluster: null
packages: []
deps: []
deps-rfc: []
est-loc: null
priority: null
pr: null
claim: null
assignee: null
blocked-by: null
closed-reason: null
---

## Context

`parity:test`'s assertion comparison can't see the exception class of a raise
assertion. `assert_raise` / `assert_raises` / `assertRaises` / `toThrow` all
normalize to kind `"raises"` (`scripts/test-compare/assertion-kinds.ts:102-103,254`),
and the value phase (`scripts/test-compare/assertion-values.ts`) compares only
literal tokens (`n:`, `s:`, `b:`, `x:nil`). An exception class is a constant
reference, so both extractors emit `null` and the comparison is skipped.

Concrete miss: `PostgreSQLAdapterTest#test_translate_no_connection_exception_to_not_established`
(`vendor/rails/v8.0.2/activerecord/test/cases/adapters/postgresql/postgresql_adapter_test.rb:497-511`)
asserts `ActiveRecord::ConnectionNotEstablished`. The trails port
(`packages/activerecord/src/adapters/postgresql/postgresql-adapter.test.ts:590-597`)
asserted `ConnectionFailed` and dropped Rails' `send_query` setup step. That
turned the test into a race that went red on main (story red-71d1a203), and no
gate flagged it.

## Acceptance criteria

- Both extractors emit a class token (e.g. `c:ConnectionNotEstablished`, keeping
  only the last constant segment) for the raised-class argument of each `raises`-kind
  assertion: Ruby `assert_raise(A, B)` / `assert_raises`, TS `assertRaises([A], …)`,
  `expect(…).rejects.toThrow(A)` / `toThrowError(A)` / `toBeInstanceOf(A)` on a
  rejection.
- A multi-class `assert_raise(A, B)` compares as a set.
- `assertion-values.ts` diffs `raises` class tokens like other values, and the
  assertion-mismatch ratchet counts them (seeded from main, only-shrink).
- Regression test: a fixture pair asserting different classes reports a value
  mismatch; the same class with a namespace prefix on one side does not.
