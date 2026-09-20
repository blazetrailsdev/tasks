---
title: "no-conditional-in-test allows only an adapter branch, forcing disables on Rails' in_memory_db? arm"
status: draft
updated: 2026-09-20
rfc: "0127-fidelity-tooling-signals-and-hygiene"
cluster: null
packages: []
deps: []
deps-rfc: []
est-loc: 140
priority: null
pr: null
claim: null
assignee: null
blocked-by: null
closed-reason: null
---

## Context

`blazetrails/no-conditional-in-test` (`eslint/no-conditional-in-test.mjs`) allows
exactly one condition inside an `it`/`test` body: an adapter check, via
`isAdapterCondition` (`:22-38`) — a `currentAdapter(...)` call, an `adapterType ===
"..."` comparison, or their `!`/`&&`/`||` combinations. Its own doc string says
"disallow conditionals in tests, except a current_adapter? branch" (`:43`).

Rails branches on `in_memory_db?` just as often, and that arm is not adapter
identity — it is `ActiveRecord::Base.lease_connection.pool.db_config.database ==
":memory:"`. `vendor/rails/activerecord/test/cases/adapters/sqlite3/sqlite3_adapter_test.rb`
alone carries four such tests, each with both arms in one method body:
`test_default_pragmas` (`:155-181`), `test_overriding_default_journal_mode_pragma`
(`:190-247`), `test_setting_new_pragma` (`:380-402`) and
`test_setting_invalid_pragma` (`:404-421`).

A faithful port must keep both arms, because the assertion-parity comparer counts
every assertion in the Rails method body — `test_default_pragmas` is 12 assertions,
six per arm. trails#7915 therefore shipped four
`// eslint-disable-next-line blazetrails/no-conditional-in-test -- mirrors Rails'
`if in_memory_db?``lines in`packages/activerecord/src/adapters/sqlite3/sqlite3-adapter.test.ts`.

Hoisting the `if` outside the `it` is not an escape: `vitest/no-conditional-tests`
is also `"error"` for `packages/activerecord/src/**/*.test.ts`
(`eslint.config.mjs:969-983`) and rejects the hoisted form too.

## Converged shape

Extend `isAdapterCondition` to a rule-level allowlist of the Rails test-context
predicates trails mirrors, keyed by the `support/adapter-helper.ts` function name —
`inMemoryDb()` first, and any sibling the sweep below turns up (`supports*` readers
already have `itIfSupports`, so they are out of scope). Rename the helper to match
what it now answers, and update the rule's `docs.description` off "a
current_adapter? branch".

Then sweep the existing disables: this file's four, plus whatever
`grep -rn "no-conditional-in-test" packages/*/src --include=*.test.ts` reports
whose condition is `inMemoryDb()`. Disables mirroring a genuinely different Rails
predicate (`supports_partial_index?` in `schema-dumper.test.ts:238-268`,
`row_format_dynamic_by_default?` in
`adapters/abstract-mysql-adapter/active-schema.test.ts:216`) stay as they are —
this story is only about the `in_memory_db?` arm.

## Acceptance criteria

- `no-conditional-in-test` accepts `if (inMemoryDb())` inside a test body, with a
  case in `eslint/no-conditional-in-test.test.mjs` covering it.
- The four disables in `sqlite3-adapter.test.ts` are removed and `pnpm lint` is clean.
- `pnpm parity:test -- --package activerecord --assertions --missing` still reports
  0 rows for `adapters/sqlite3/sqlite3_adapter_test.rb`.
