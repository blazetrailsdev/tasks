---
title: "Attribute-set envelope loses the type key for types outside ActiveModel's registry"
status: draft
updated: 2026-09-05
rfc: "0134-activemodel-surfaced-deviations"
cluster: null
packages: []
deps: []
deps-rfc: []
est-loc: 120
priority: null
pr: null
claim: null
assignee: null
blocked-by: null
closed-reason: null
---

## Context

`AttributeSetCodec`'s `toEnvelope`
(`packages/activemodel/src/attribute-set/codecs/codec.ts`) writes a registry key
per attribute so a JSON/YAML envelope can name the type Ruby simply marshals
(`activemodel/lib/active_model/attribute_set/yaml_encoder.rb:12-20`). Since
`type-name-property-registry-key-burndown` (PR #7513) that key comes from
`TypeRegistry#keyFor`, which resolves a type instance's constructor against the
classes handed to `register`
(`packages/activemodel/src/type/registry.ts`, mirroring
`activemodel/lib/active_model/type/registry.rb:9-21`).

`keyFor` therefore only answers for a class registered on ActiveModel's
`typeRegistry` — the eleven built-ins registered in
`packages/activemodel/src/type.ts` (Rails' `active_model/type.rb:44-56`) plus
the five ActiveRecord adds in `packages/activerecord/src/type.ts` (`date`,
`datetime`, `time`, `text`, `json`). Every other type an attribute can actually
carry is invisible to it:

- the PostgreSQL OID types, which Rails registers on the adapter's own
  `AdapterSpecificRegistry`, not on `ActiveModel::Type`'s
  (`activerecord/lib/active_record/connection_adapters/postgresql_adapter.rb:590-630`
  `initialize_type_map`);
- adapter-specific overrides registered through
  `packages/activerecord/src/type.ts`'s `_registry`
  (`activerecord/lib/active_record/type.rb:69-81`);
- the decorators — `Serialized`, `LockingType`, `TimeZoneConverter`,
  `EnumType` — which Rails never registers under a key at all.

For those, `keyFor` returns `null`, so `toEnvelope` writes `null` and
`fromEnvelope` rebuilds the attribute with no type instead of the previous
behaviour, where the (now deleted) `Type#name` string was written and
`lookupType`'s `catch` substituted `Type.default_value()` with a one-time warn.
Both shapes lose the type; the difference is that the `null` shape is
indistinguishable from an attribute that genuinely had no type, and it silently
skips the warn that told a caller schema drift had happened.

## Acceptance criteria

- An attribute whose type is not in ActiveModel's `typeRegistry` round-trips
  through `jsonCodec` / `yamlCodec` distinguishably from an attribute whose type
  is genuinely `null` — either by resolving the key through the registry that
  DOES own the type (ActiveRecord's `_registry` /
  `AdapterSpecificRegistry#lookup`, `activerecord/lib/active_record/type.rb:19-27`)
  or by keeping the unknown-type envelope value distinct from `null`.
- The unknown-key path still lands on `Type.default_value()`
  (`activemodel/lib/active_model/type.rb:22-24`) with the existing one-time warn,
  as `lookupType` does today.
- No new `name`-shaped field on any type class: the key stays a registry
  concern, per the receipt on `TypeRegistry#keyFor`.
- Covered by a `.trails.test.ts` case in
  `packages/activemodel/src/attribute-set/codecs/` — the codec layer has no
  Rails counterpart, so the tests are trails-only by construction.
