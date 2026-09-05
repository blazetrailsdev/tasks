---
title: "serialized-type-must-delegate-to-subtype"
status: ready
updated: 2026-09-05
rfc: "0134-activemodel-surfaced-deviations"
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

`ActiveRecord::Type::Serialized` is
`DelegateClass(ActiveModel::Type::Value)`
(`vendor/rails/activerecord/lib/active_record/type/serialized.rb:5`) and defines
no `type` of its own, so Ruby forwards `type` to the wrapped subtype — a
serialized text column answers `:text`, a serialized json column `:json`.

trails' `Serialized` (`packages/activerecord/src/type/serialized.ts:108`)
answered the invented constant `"serialized"` until #7412 moved every type
class off the `name` field; it now answers `undefined`, inheriting
`ValueType#type` (the port of `value.rb:34-35`). Both are wrong against Rails,
and the sibling `LockingType` — the same `DelegateClass(Type::Value)` shape at
`locking/optimistic.rb:206` — already carries its forwarder
(`packages/activerecord/src/locking/optimistic.ts:24-26`). #7412 deliberately
left this one alone rather than add a second forwarder row beside a deviation.

Readers that care: `attribute-methods/time-zone-conversion.ts:259` gates on
`castType.type()` being `"datetime"`/`"time"`, `encryption/encrypted-attribute-type.ts:104`
forwards it, and the three adapters' `columns` builders
(`sqlite3-adapter.ts:634`, `postgresql-adapter.ts:2240`,
`connection-adapters/abstract/schema-statements.ts:1690`) put it in the column
hash.

## Converged shape

```ts
override type(): string | undefined {
  return this.subtype.type();
}
```

placed as `LockingType`'s is, beside the other written-out forwarders. Note the
extra-surface consequence recorded on #7412: the Ruby extractor records a
`DelegateClass(...)` superclass as null, so the forwarder scores as a moved
extra in activerecord's `total` — see
[[api-compare-nulls-a-delegateclass-superclass]].

## Acceptance criteria

- `Serialized#type()` returns the subtype's `type()`, matching Ruby's
  `DelegateClass` forwarding at `serialized.rb:5`.
- A test covers a serialized attribute over a non-default subtype reporting that
  subtype's `type()`; it fails on the baseline.
- `pnpm parity:api:extra:gate` stays green.
