---
title: "psych-dump-type-constants"
status: ready
updated: 2026-09-29
rfc: "0155-assertion-surfaced-port-bugs"
cluster: null
packages: []
deps: ["move-activesupport-yaml-into-ruby-compat-psych"]
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

`psych-object-protocol-for-record-yaml-round-trip` ported Psych's object
protocol into `packages/activesupport/src/yaml.ts` (`dump` / `unsafeLoad`,
the `YAMLTree` / `ToRuby` visitors, `Coder`, `!ruby/object:` and
`!ruby/class`), with `Core#encodeWith` / `#initWith`, `LegacyYamlAdapter`
and `Attribute#encodeWith` / `#initWith`. A record whose attributes all
carry their class's default types round-trips (`store_test.rb:327-335`;
`yaml_serialization_test.rb` roundtrip / psych roundtrip / v2 / 4.1).

What still fails is any record whose dump carries an `ActiveModel::Type`:
`YAMLEncoder#encode` (`activemodel/lib/active_model/attribute_set/yaml_encoder.rb`)
nils only the top attribute's type, so an assigned attribute's
`original_attribute` (and every attribute of a new record whose type is not the
class default) dumps its `@type` as `!ruby/object:ActiveModel::Type::String`,
`ActiveRecord::Type::Serialized`, `ActiveRecord::AttributeMethods::TimeZoneConversion::TimeZoneConverter`,
and the adapter OID types. trails spells those classes `StringType`,
`BooleanType`, … with no Ruby constant name, so the tag is wrong on dump and
`constantize` raises `NameError: uninitialized constant StringType` on load.

Also surfaced while porting `yaml_serialization_test.rb`:

- `test_types_of_virtual_columns_are_not_changed_on_round_trip`:
  `Author.select("authors.*, count(posts.id) as posts_count")...first` answers
  `readAttribute("posts_count") == 5` but `author.posts_count` is `undefined`
  before any YAML is involved — the virtual-column reader is not generated.
- `test_active_record_relation_serialization`: `Relation#encode_with`
  (`activerecord/lib/active_record/relation.rb:348`) is
  `coder.represent_seq(nil, records)`, which needs `Coder#represent_seq` and a
  loaded relation (see CLAUDE.md § "Relation is evaluated by an async query").
- `test_deserializing_rails_v1_mysql_yaml` / `rails_4_2_0_yaml` revive
  `ActiveRecord::AttributeSet`, `ActiveRecord::LazyAttributeHash` and
  `ActiveRecord::Type::*` constants; their fixture files
  (`vendor/rails/v8.0.2/activerecord/test/support/yaml_compatibility_fixtures/`)
  are not yet copied to `packages/activerecord/src/test-helpers/support/`.
- `Core#init_with` reaches `initWithAttributes`, which in trails runs neither
  `init_internals` nor the find/initialize callbacks (`core.rb:508-520`); the
  revive path gets a constructed record from `Base.allocate`, the suppressed
  construction `_instantiate` already used.

## Acceptance criteria

- [ ] Every `ActiveModel::Type` / `ActiveRecord::Type` / adapter type class
      answers its Ruby constant name on dump and resolves through `constantize`
      on `YAML.unsafeLoad`.
- [ ] The `BLOCKED: psych-dump-type-constants` skips in
      `packages/activerecord/src/yaml-serialization.test.ts` run unskipped
      (or are re-filed with a specific blocker).

## Home (RFC 0000-psych-in-ruby-compat)

Psych moves out of `packages/activesupport/src/yaml.ts` into
`packages/ruby-compat/src/psych*.ts` (layout: RFC Design §1) in
`move-activesupport-yaml-into-ruby-compat-psych`. Write this story's code there, as `Psych` namespace
members, and not in activesupport.
