---
title: "Type::Serialized reimplements Ruby == instead of delegating to it"
status: draft
updated: 2026-09-03
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

`packages/activerecord/src/type/serialized.ts` carries a private equality
machine that Rails has no counterpart for at all —
`isValueComparable`, `hasEquals`, `hasValueEquality`, `unwrapHash`,
`isPlainObject`, `valuesEqual` and `collectionsEqual`, roughly 70 lines feeding
`isChanged` and `isDefaultValue`.

`vendor/rails/activerecord/lib/active_record/type/serialized.rb` has none of
it. Its three relevant bodies are:

- `changed_in_place?(raw_old_value, value)` (`serialized.rb:41-43`) —
  `return false if value.nil?; raw_old_value.nil? != value.nil? || subtype.changed_in_place?(raw_old_value, encoded(value))`
- `default_value?(value)` (`serialized.rb:57-59`) — `value == coder.load(nil)`
- `changed?` is inherited from `ActiveModel::Type::Value`
  (`vendor/rails/activemodel/lib/active_model/type/value.rb:52-54`) —
  `old_value != new_value`

That is, Rails delegates both comparisons to Ruby `==`. The TS file reimplements
`==` for hashes, arrays, and value objects instead, and the reimplementation is
what made #7431 (`drop-deep-stringify-keys-around-to-hash`) touch this file at
all: `unwrapHash` had to learn `@blazetrails/ruby-compat`'s `Hash` because
`HashWithIndifferentAccess#toHash` now answers one.

## Converged shape

`Serialized#isDefaultValue` is `value == coder.load(nil)` and `isChanged` is
`oldValue != newValue`, both spelled through whatever the repo's settled
Ruby-`==` analogue is — the same call every other ported `==` site uses, not a
private one in this file. The seven helpers are then deleted, not relocated.

The scope of the work is establishing that analogue for the shapes this type
sees (a `HashWithIndifferentAccess`, a ruby-compat `Hash`, a plain object, an
array, a value object with `valueOf`), since a JS `===` is not Ruby's `==` for
any of them. If a shared helper already exists for it, this is a deletion; if
it does not, it belongs in `ruby-compat` beside `rbEqual`
(`packages/ruby-compat/src/rb-equal.ts`), not here.

## Acceptance criteria

- `isValueComparable`, `hasEquals`, `hasValueEquality`, `unwrapHash`,
  `isPlainObject`, `valuesEqual` and `collectionsEqual` are gone from
  `packages/activerecord/src/type/serialized.ts`.
- `isDefaultValue` and `isChanged` are call-for-call with `serialized.rb:57-59`
  and `value.rb:52-54`.
- `store.test.ts`, `serialized-attribute.test.ts`, `json-serialization.test.ts`
  and `yaml-serialization.test.ts` still pass, including the nested
  `HashWithIndifferentAccess` round-trip
  ("serialize stored nested attributes").
- `pnpm parity:api:calls` and `parity:api:calls:args` show no new rows.
