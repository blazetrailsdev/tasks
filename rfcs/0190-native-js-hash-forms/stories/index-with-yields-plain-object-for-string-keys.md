---
title: "indexWith yields a plain object for String elements; drop Object.fromEntries copies"
status: done
updated: 2026-10-16
rfc: "0190-native-js-hash-forms"
cluster: null
packages: []
deps: []
deps-rfc: []
est-loc: 60
priority: null
pr: trails#8967
claim: "2026-10-16T01:14:50Z"
assignee: "index-with-yields-plain-object-for-string-keys"
blocked-by: null
closed-reason: null
---

## Context

Rails `Enumerable#index_with` (`vendor/rails/v8.0.2/activesupport/lib/active_support/core_ext/enumerable.rb`) builds a Hash keyed by the elements. trails' `indexWith` (`packages/activesupport/src/enumerable-utils.ts:59-71`) always builds a ruby-compat `Hash`. Several callers immediately copy the result with `Object.fromEntries`, a call Rails does not make: `activerecord/src/attribute-methods.ts` `attributesWithValues` (trails#8963), `activemodel/src/attribute-set.ts:151`, `activemodel/src/serialization.ts:171` and `activemodel/src/access.ts:11`.

## Acceptance criteria

- `indexWith` answers a plain object when every element is a String, the same way `transformKeys` answers a `Hash` for object keys. It still answers a `Hash` otherwise.
- The `Object.fromEntries` copies around `indexWith` are removed from the callers listed above, and the remaining callers are checked.
- `pnpm parity:api:calls` / `calls:args` stay green.
