---
title: "converge-normalized-value-type-and-locking-type-onto-delegate-class"
status: draft
updated: 2026-09-12
rfc: "0130-activerecord-extra-surface-receipt-burndown"
cluster: null
packages: []
deps: []
deps-rfc: []
est-loc: 220
priority: null
pr: null
claim: null
assignee: null
blocked-by: null
closed-reason: null
---

## Context

trails#7728 ported `DelegateClass` as a ruby-compat primitive
(`packages/ruby-compat/src/delegate.ts`, from `vendor/ruby/lib/delegate.rb:394-443`) and converged
`ActiveRecord::Type::Serialized` onto it. Rails has two more `DelegateClass(Type::Value)` subclasses
and neither is converged:

- `ActiveRecord::Normalization::NormalizedValueType < DelegateClass(ActiveModel::Type::Value)`
  (`vendor/rails/activerecord/lib/active_record/normalization.rb:118`), `super(cast_type)` at `:128`.
  trails' is a bare `export class NormalizedValueType {` (`packages/activerecord/src/normalization.ts:80`)
  — it does not even extend `ValueType`, and hand-writes the members it needs, including
  `itselfIfSerializeCastValueCompatible` at `:113`.
- `ActiveRecord::Type::LockingType < DelegateClass(Type::Value)`
  (`vendor/rails/activerecord/lib/active_record/locking/optimistic.rb:206`). trails'
  is `export class LockingType extends ValueType<number>` holding a `private _subtype`
  (`packages/activerecord/src/locking/optimistic.ts:14-18`), so nothing forwards to the subtype
  except what is hand-written.

Both are the same divergence `Serialized` had before trails#7728: inherited `Value` members run the
wrapper's own bodies instead of reaching the delegate, and anything not hand-written is simply
absent. `scripts/api-compare/compare.ts:2267` already notes the family ("AR LockingType /
Serialized: Rails uses `DelegateClass(Type::Value)`").

## Acceptance criteria

- `NormalizedValueType` reads `extends DelegateClass(ValueType)` with `super(castType)`, mirroring
  `normalization.rb:118,128`, and its hand-written stand-in forwarders are deleted.
- `LockingType` reads `extends DelegateClass(ValueType)`; `_subtype` becomes the delegate, so
  `deserialize`'s `super.to_i` (`optimistic.rb:211-212`) and `LockingType.new`'s
  `self === subtype ? subtype : super` (`:207-209`) port against the delegate.
- `parity:api:extra` novel/total for both files does not rise; any receipt the hand-written
  forwarders carried is deleted with them.
