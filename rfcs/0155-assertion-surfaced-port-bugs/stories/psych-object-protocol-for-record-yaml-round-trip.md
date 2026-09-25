---
title: "psych-object-protocol-for-record-yaml-round-trip"
status: draft
updated: 2026-09-25
rfc: "0155-assertion-surfaced-port-bugs"
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

`store-yaml-dump-load-model-round-trip` (the `dump, load and dump again a model`
case in `packages/activerecord/src/store.test.ts`, mirroring
`vendor/rails/activerecord/test/cases/store_test.rb:327-335`) cannot be ported
because trails has no way to `YAML.dump` / `YAML.unsafe_load` a record.

In Rails that round trip is Psych's object protocol, not an ActiveRecord API:

- `YAML.dump(record)` emits a `!ruby/object:AdminUser` mapping by calling
  `Core#encode_with` (`vendor/rails/activerecord/lib/active_record/core.rb:587-591`),
  which hands `@attributes` to `yaml_encoder.encode`
  (`activemodel/lib/active_model/attribute_set/yaml_encoder.rb`) and adds
  `new_record` / `active_record_yaml_version`. Each `ActiveModel::Attribute`
  (and its type, when not the default) is then dumped by Psych as a plain
  ivar mapping under its own `!ruby/object:` tag.
- `YAML.unsafe_load` resolves the tag to a class, allocates it, and calls
  `Core#init_with` (`core.rb:498-502`) → `LegacyYamlAdapter.convert`
  (`legacy_yaml_adapter.rb`) → `yaml_encoder.decode` → `init_with_attributes`
  (`core.rb:508-520`, already ported as `initWithAttributes` in `core.ts:252`).

What trails has: `@blazetrails/activesupport/yaml` re-exports the `yaml` npm
package's `parse` / `stringify` (`packages/activesupport/src/yaml.ts`), with no
class-tag emission or resolution; `YAMLEncoder`
(`packages/activemodel/src/attribute-set/yaml-encoder.ts`) and
`ModelSchema.yamlEncoder` (`model-schema.ts:408`) exist; `Core#encode_with` /
`init_with` and `LegacyYamlAdapter` do not. `encodeWith` / `initWith` exist only
ad hoc on `Column`, `SchemaCache` and `LockingType`, each driven by a
hand-written caller. `yaml_serialization_test.rb` is entirely PERMANENT-SKIP
(`packages/activerecord/src/yaml-serialization.test.ts`) for this same gap.

## Acceptance criteria

- [ ] A decided home for Psych's object protocol (tag emission for
      `!ruby/object:<Class>`, `encode_with` / `init_with` dispatch, ivar-mapping
      fallback, class resolution through `constantize` on unsafe load), built on
      the `yaml` npm package's custom tags rather than a hand-rolled emitter.
- [ ] `Core#encodeWith` / `Core#initWith` ported at the Rails names
      (`core.rb:498-502,587-591`), with `LegacyYamlAdapter.convert`.
- [ ] `dump, load and dump again a model` in `store.test.ts` runs unskipped with
      Rails' two round trips and `==` assertions.
- [ ] The `yaml_serialization_test.rb` PERMANENT-SKIP stubs are re-examined
      against the new surface (convert what now ports; file the rest).
