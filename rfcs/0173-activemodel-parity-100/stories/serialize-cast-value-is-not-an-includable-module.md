---
title: "serialize-cast-value-is-not-an-includable-module"
status: draft
updated: 2026-10-01
rfc: "0173-activemodel-parity-100"
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

`ActiveModel::Type::SerializeCastValue` (`vendor/rails/v8.0.2/activemodel/lib/active_model/type/serialize_cast_value.rb`)
is a Concern that `Type::Value` includes (`type/value.rb:10`) and `ActiveRecord::Normalization::NormalizedValueType`
includes again (`activerecord/lib/active_record/normalization.rb:119`). Its `self.included` hook
(`serialize_cast_value.rb:21-23`) is

```ruby
def self.included(klass)
  klass.include DefaultImplementation unless klass.method_defined?(:serialize_cast_value)
end
```

trails has no carrier for it. `packages/activemodel/src/type/serialize-cast-value.ts` is a TS
`namespace` of loose functions, not a module `include()` can mix in, so nothing fires the
symbol-keyed `included` callback. The module's members are hand-written onto the class instead:
`ValueType#serializeCastValue`, `#itselfIfSerializeCastValueCompatible` and
`static serializeCastValueCompatible` (`packages/activemodel/src/type/value.ts:102-141`), and
`NormalizedValueType` re-declares `itselfIfSerializeCastValueCompatible`
(`packages/activerecord/src/normalization.ts:115-121`). The ported Rails test carries a hand-rolled
`includeSerializeCastValue` helper (`packages/activemodel/src/type/serialize-cast-value.test.ts:5-14`)
because there is no module to `include`.

Found by `activemodel-lifecycle-hook-semantics-audit`, which mapped the other six skipped hooks to
a carrier and a test.

Two behaviours follow from the missing module and are observable:

- `DefaultImplementation` sits ABOVE the including class in Ruby's ancestry, so
  `Type::Value.serialize_cast_value_compatible?` is `false`
  (`ancestors.index(DefaultImplementation)` is 1, `ancestors.index(Value)` is 0,
  `serialize_cast_value.rb:9-12`). trails' `ValueType.prototype` owns both `serialize` and
  `serializeCastValue`, so `ValueType.serializeCastValueCompatible()` is `true`.
- `SerializeCastValue#initialize` (`serialize_cast_value.rb:41-44`) eagerly computes the flag on
  construction; trails computes it lazily on first read.

## Acceptance criteria

- [ ] `SerializeCastValue` is a module `include()` accepts, with `ClassMethods`
      (`serialize_cast_value_compatible?`), `DefaultImplementation`, `itself_if_serialize_cast_value_compatible`
      and `initialize` at their Rails names in `type/serialize-cast-value.ts`.
- [ ] Its `included` body is the symbol-keyed callback (`Symbol.for("@blazetrails/ruby-compat:included")`)
      and includes `DefaultImplementation` only when the class does not already answer `serializeCastValue`.
- [ ] `ValueType` and `NormalizedValueType` get the members through `include(…, SerializeCastValue)`;
      their hand-written copies are deleted.
- [ ] `serialize-cast-value.test.ts` spells each Rails `include SerializeCastValue` as `include()`;
      the `includeSerializeCastValue` helper is deleted.
- [ ] `ValueType.serializeCastValueCompatible()` answers `false`, as `Type::Value.serialize_cast_value_compatible?` does.
