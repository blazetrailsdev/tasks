---
title: "migration-test-inline-adapter-branches"
status: draft
updated: 2026-09-18
rfc: "0155-assertion-surfaced-port-bugs"
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

`packages/activerecord/src/migration.test.ts` keeps two adapter-branch bodies in same-file functions,
`checkValueOfE` (Rails `test_add_table_with_decimals`, `vendor/rails/activerecord/test/cases/migration_test.rb:498-517`)
and `checkDefaultFunctionAndInsertRow` (`test_default_functions_on_columns`, `migration_test.rb:1457-1470`),
because `vitest/no-conditional-in-test` is `error` for `packages/activerecord/**/*.test.ts`. Rails keeps
the `current_adapter?` arms inline in the test body.

## Acceptance criteria

- Both branches sit inline in their tests with the same arms and assertions as Rails.
- Reached by an adapter-branch idiom the lint rule accepts (e.g. a `describeIfPg`/`itIfAdapter` split
  that yields one test per arm with the Rails name preserved), not by an eslint-disable.
- `parity:test --assertions` stays at 0 for `migration_test.rb`.
