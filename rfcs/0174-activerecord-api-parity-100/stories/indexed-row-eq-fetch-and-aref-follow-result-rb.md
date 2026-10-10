---
title: "activerecord: Result::IndexedRow ==, fetch and [] follow result.rb"
status: ready
updated: 2026-10-10
rfc: "0174-activerecord-api-parity-100"
cluster: null
packages: []
deps: []
deps-rfc: []
est-loc: 60
priority: null
pr: null
claim: null
assignee: null
blocked-by: null
closed-reason: null
---

## Context

`Result::IndexedRow` (`packages/activerecord/src/result.ts`) got Rails' `to_h` in trails#8319. Three sibling
bodies in the same class still differ from `vendor/rails/v8.0.2/activerecord/lib/active_record/result.rb`:

- `==` (`result.rb:58-64`) is `other.is_a?(Hash) ? to_hash == other : super`. trails' `equals` has an
  `other instanceof IndexedRow` identity arm first and then a hand-rolled key-count / `===` comparison of any
  object, where Ruby's Hash `==` compares values with `==` (ruby-compat's `rbEqual`).
- `fetch` (`result.rb:70-78`) branches on `if index = @column_indexes[column]`; trails branches on
  `hasOwnProperty`, and raises `KeyError` with `"${column}"` where Rails renders `column.inspect` (`rbInspect`).
- `[]` (`result.rb:80-84`) is the same `if index = @column_indexes[column]` guard; trails' `get` returns
  `undefined` rather than `nil` for a missing column.

## Acceptance criteria

- [ ] `equals`, `fetch` and `get` follow the three Rails bodies above, arm for arm.
- [ ] `fetch`'s `KeyError` message uses `rbInspect(column)`.
- [ ] `result.rb -> result.ts` stays 28/28; `pnpm parity:api:calls` and `:calls:args` stay green.
- [ ] A trails test covers `equals` against a hash whose values are equal by `rbEqual` but not `===`, failing on
      the current body.
