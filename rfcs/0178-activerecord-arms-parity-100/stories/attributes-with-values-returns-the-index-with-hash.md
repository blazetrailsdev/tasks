---
title: "activerecord: attributes_with_values returns the index_with hash"
status: claimed
updated: 2026-10-07
rfc: "0178-activerecord-arms-parity-100"
cluster: null
packages: []
deps: []
deps-rfc: []
est-loc: 120
priority: null
pr: null
claim: "2026-10-07T20:34:16Z"
assignee: "base-constructor-enters-inheritance-new-for-a-bare-new"
blocked-by: null
closed-reason: null
---

## Context

`attributes_with_values` (`vendor/rails/v8.0.2/activerecord/lib/active_record/attribute_methods.rb:503-505`)
returns `attribute_names.index_with { |name| @attributes[name] }` as is.
`packages/activerecord/src/attribute-methods.ts` `attributesWithValues` wraps the same
`indexWith` in `Object.fromEntries`, a call Rails does not make, because its three callers
(`persistence.ts` `_updateRow` and `_createRecord`, `locking/optimistic.ts` `_updateRow`)
hand the result to `_insertRecord` / `_updateRecord`, whose `values` parameter is a plain
`Record<string, unknown>` read with `Object.entries`, where activesupport's `indexWith`
returns a `Hash`. The body carries `@inventedArm fromEntries`.

## Acceptance criteria

- [ ] `attributesWithValues` returns `indexWith(...)` directly.
- [ ] `_insertRecord` / `_updateRecord` and the values they forward read the `Hash` it returns.
- [ ] The `@inventedArm fromEntries` receipt is deleted.
