---
title: "type-name-property-registry-key-burndown"
status: ready
updated: 2026-09-05
rfc: "0134-activemodel-surfaced-deviations"
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

Rails' `ActiveModel::Type::Value` has no `name`
(`vendor/rails/activemodel/lib/active_model/type/value.rb:9-156`); the unique
type name is `type`, overridden per subclass (`integer.rb:56-58`,
`float.rb:39-41`, `decimal.rb:49-51`, `boolean.rb:26-28`, `date.rb:30-32`,
`time.rb:45-47`, `date_time.rb:49-51`, `binary.rb:12-14`,
`immutable_string.rb:44-46`; `String` and `BigInteger` deliberately override
nothing and inherit).

PR for `type-value-split-and-name-property-burndown` converged every `type()`
body to the Rails literal, so `name` no longer drives `type()` anywhere. What
survives is `name` as the **registry key**: `AttributeSet::YAMLEncoder#encode`
(`packages/activemodel/src/attribute-set/yaml-encoder.ts:48`) writes
`attr.type.name` into the envelope and `decode` feeds it back through
`TypeRegistry#lookup`. Ruby marshals the type object itself
(`attribute_set/yaml_encoder.rb:12-20`), so it needs no such key. The keys are
not `type()` values — `"immutable_string"`, `"big_integer"` and `"string"` all
differ from what `type()` returns — so the field cannot simply be deleted.

`name` is declared on `Type`/`ValueType` (`type/value.ts`) and overridden by the
11 activemodel subclasses plus ~25 activerecord type classes
(`activerecord/src/type/*.ts`, `connection-adapters/postgresql/oid/*.ts`), each
carrying a `@noRailsEquivalent CONVERGEABLE` receipt pointing here.

## Acceptance criteria

- `name` is gone from `ActiveModel::Type::Value`'s mirror and every subclass in
  activemodel and activerecord.
- The YAML/JSON attribute-set envelope still round-trips every registered type
  key, through a mechanism that lives on `TypeRegistry` (one receipted member)
  rather than on every type class.
- `pnpm parity:api:extra --package activemodel` and `--package activerecord`
  both drop; `pnpm parity:api:extra:gate` stays green (activerecord is gated).
