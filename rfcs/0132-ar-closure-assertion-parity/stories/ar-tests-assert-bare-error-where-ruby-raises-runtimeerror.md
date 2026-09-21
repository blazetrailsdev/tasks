---
title: "AR tests assert a bare Error where Ruby raises RuntimeError/StandardError"
status: claimed
updated: 2026-09-21
rfc: "0132-ar-closure-assertion-parity"
cluster: null
packages: []
deps: []
deps-rfc: []
est-loc: 150
priority: 5
pr: null
claim: "2026-09-21T13:41:59Z"
assignee: "assert-helper-only-tests-trip-the-missing-assertions-guard"
blocked-by: null
closed-reason: null
---

## Context

Ruby's `raise "some message"` raises a `RuntimeError`, and `assert_raises(RuntimeError)`
/ `assert_raises(StandardError)` name that class. Several AR test files instead throw a
bare JS `Error` and assert `assertRaises([Error], ...)`, which passes for any exception
at all — including one raised from the wrong place — so the arm Rails pins to a class is
not pinned in the port.

trails#7909 converged the instances inside `transactions.test.ts` and `adapter.test.ts`
(`RuntimeError` for `raise "Make the transaction rollback"` at
`vendor/rails/activerecord/test/cases/transactions_test.rb:641,745`, for `raise("OH NOES")`
at `:1074`, for `raise "commit failed"` / `"rollback failed"` / `"begin failed"` at
`:288,297,325`; `StandardError` for `StandardError.new` at
`vendor/rails/activerecord/test/cases/adapter_test.rb:246-248`). The rest of the suite
still carries the bare-`Error` shape.

Remaining `assertRaises([Error], ...)` sites at the time of filing:

- `packages/activerecord/src/connection-pool.test.ts:656`
- `packages/activerecord/src/associations.test.ts:1220`
- `packages/activerecord/src/base.test.ts:220`
- `packages/activerecord/src/locking.test.ts:743`
- `packages/activerecord/src/callbacks.test.ts:531,544,557`
- `packages/activerecord/src/migration.test.ts:135,233,927,960,996,1075`

`packages/activerecord/src/transactions.test.ts` also still throws a bare `new Error(...)`
at lines 95, 392, 527, 823, 846, 868, 901, 908, 915 and 1564 where the Ruby body writes
`raise "str"` — those throws are the other half of the same divergence and should move to
`RuntimeError` with them.

This is the test-side twin of the `bare-error-throws` cluster already in this RFC, which
covers production raise sites.

## Converged shape

For each site, read the Rails body and use the class it raises: `RuntimeError` (from
`@blazetrails/ruby-compat`) for a bare `raise "str"`, `StandardError` for an explicit
`StandardError.new`, and the specific `ActiveRecord::` class wherever Rails names one.
Both halves move together — the `throw` and the `assertRaises` class list — so the arm
stays pinned.

## Acceptance criteria

- No `assertRaises([Error], ...)` remains in `packages/activerecord/src/**/*.test.ts`
  where the Rails counterpart names a class.
- Every converted throw uses the class the Rails body raises, cited `file:line`.
- `pnpm parity:test -- --package activerecord --assertions` delta is non-negative.
