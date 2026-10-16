---
title: "attributes-with-values-yields-plain-object"
status: ready
updated: 2026-10-15
rfc: "0190-native-js-hash-forms"
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

`ActiveRecord::AttributeMethods#attributes_with_values` is `attribute_names.index_with { |name| @attributes[name] }` (`vendor/rails/v8.0.2/activerecord/lib/active_record/attribute_methods.rb:503-505`), a plain Ruby Hash keyed by String. trails' `attributesWithValues` (`packages/activerecord/src/attribute-methods.ts:542-547`) returns ruby-compat `Hash`, because `indexWith` (`packages/activesupport/src/enumerable-utils.ts:59-71`) always builds a `Hash` (its elements may be any type, 16 non-test callers).

trails#8959 made `updateColumns` pass `{}` to `_updateRecord` (`persistence.rb:616-619`), so `_updateRecord`'s `values` (`packages/activerecord/src/persistence.ts:322-326`) is typed `Map<string, unknown> | Record<string, unknown>`: `_update_row` (`persistence.ts:~946`) and optimistic locking (`locking/optimistic.ts:177`, `LockingHost._updateRecord` at `:68`) still pass the `Hash`. `_insertRecord` (`persistence.ts:282`) takes `Hash` for the same reason.

## Acceptance criteria

- `indexWith` answers a plain object when every element is a String (as `transformKeys` answers a `Hash` for object keys), or `attributesWithValues` otherwise yields `{}` while still calling `index_with`.
- `_updateRecord`, `_insertRecord` and `LockingHost._updateRecord` take `Record<string, unknown>` only; the union is gone.
- `pnpm parity:api:calls` / `calls:args` green with no rows added.
