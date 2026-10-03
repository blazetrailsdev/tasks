---
title: "SerializeCastValue is a class module, so prepend skips Concern#prepend_features"
status: done
updated: 2026-10-03
rfc: "0173-activemodel-parity-100"
cluster: null
packages: []
deps: []
deps-rfc: []
est-loc: 90
priority: null
pr: trails#8444
claim: "2026-10-03T11:55:23Z"
assignee: "bcrypt-generate-salt-reaches-bc-salt"
blocked-by: null
closed-reason: null
---

## Context

Surfaced by trails PR 8366 (`activemodel-burn-extra-surface-to-zero`).

`ActiveModel::Type::SerializeCastValue` (`vendor/rails/v8.0.2/activemodel/lib/active_model/type/serialize_cast_value.rb:5-6`)
is a module that does `extend ActiveSupport::Concern`. trails ports it as a class module
(`packages/activemodel/src/type/serialize-cast-value.ts`, `export class SerializeCastValue` with a
`static [included]` hook that calls `extend(klass, ClassMethods)` itself). A class module has no
`prepend_features` hook, so `prepend SerializeCastValue` does not do what
`ActiveSupport::Concern#prepend_features` does
(`vendor/rails/v8.0.2/activesupport/lib/active_support/concern.rb:139-150`:
`base.singleton_class.prepend const_get(:ClassMethods)`).

The Rails test "uses #serialize_cast_value when a delegate class prepends SerializeCastValue"
(`vendor/rails/v8.0.2/activemodel/test/cases/type/serialize_cast_value_test.rb`) is therefore ported in
`packages/activemodel/src/type/serialize-cast-value.test.ts` as `prepend(delegateClass, SerializeCastValue)`
followed by a hand-written `extend(delegateClass, ClassMethods)`.

trails has a real Concern port (`packages/activesupport/src/concern.ts`, `Concern.prependFeatures`) that a
`Module` instance extended with `Concern` gets; `packages/activerecord/src/encryption/extended-deterministic-queries.ts`
(`CoreQueries`) is an existing example of that shape.

## Converged shape

`SerializeCastValue` is a `Module` extended with `Concern`, carrying `ClassMethods`, so both `include()` and
`prepend()` reach the Concern's feature hooks and the test's extra `extend` line is deleted. The
`self.included` body (`serialize_cast_value.rb:21-23`) and `initialize` (`:41-44`) keep their symbol-keyed hooks.

## Acceptance criteria

- [ ] `prepend(klass, SerializeCastValue)` alone gives `klass` `serializeCastValueCompatible`.
- [ ] The prepend test in `serialize-cast-value.test.ts` has no `extend(delegateClass, ClassMethods)` line.
- [ ] `pnpm parity:api` keeps `type/serialize_cast_value.rb` at 5/5 and `pnpm parity:api:extra --package activemodel` stays at total 0.
