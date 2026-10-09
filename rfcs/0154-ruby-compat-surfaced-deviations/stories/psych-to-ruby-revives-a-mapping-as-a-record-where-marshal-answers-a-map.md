---
title: "psych-to-ruby-revives-a-mapping-as-a-record-where-marshal-answers-a-map"
status: draft
updated: 2026-10-09
rfc: "0154-ruby-compat-surfaced-deviations"
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

Surfaced by trails#8703 (`SchemaCache._load_from` through `YAML.unsafe_load`).

Ruby's Psych revives an untagged YAML mapping as a `Hash` (`vendor/ruby/v3.3.11/ext/psych/lib/psych/visitors/to_ruby.rb`, `visit_Psych_Nodes_Mapping` → `revive_hash(register(o, {}), o)`), and `Marshal.load` answers a `Hash` for `TYPE_HASH`. A caller cannot tell the two apart.

trails has two carriers for that one type:

- `packages/ruby-compat/src/psych/visitors/to-ruby.ts` `visitMapping` registers `Object.create(null)` — a null-prototype record — for an untagged mapping, for `!ruby/object:Hash`, and for the fall-through arm.
- ruby-compat's `Marshal.load` answers a `Map`.

`SchemaCache` stores `Map`s (`packages/activerecord/src/connection-adapters/schema-cache.ts`, `_columns` / `_primaryKeys` / `_dataSources` / `_indexes`), so `init_with` (`vendor/rails/v8.0.2/activerecord/lib/active_record/connection_adapters/schema_cache.rb:267-278`) receives records from the YAML arm and `Map`s from the Marshal arm. To bridge it, `deepDeduplicate`'s `when Hash` arm (`schema_cache.rb:449-451`) grew a second test, `typeof value === "object" && value && !Object.getPrototypeOf(value)`, which converts the record to a `Map`. It carries `@inventedArm if — CONVERGEABLE` onto this story. A cache whose coder says `deduplicated: true` skips `derive_columns_hash_and_deduplicate_values` and would keep the records.

`YAMLTree#visitHash` (`packages/ruby-compat/src/psych/visitors/yaml-tree.ts`) already dumps both carriers as one mapping, so only the load side disagrees.

## Acceptance criteria

- [ ] `ToRuby` revives a mapping as the same carrier `Marshal.load` answers for a Hash, or the two are otherwise made one carrier; the decision names every `YAML.unsafeLoad` / `yamlParse` consumer it moves (`coders/yaml-column.ts`, `store.ts`, i18n's YAML loader).
- [ ] `deepDeduplicate` in `schema-cache.ts` has Rails' single `Hash` test again and its `@inventedArm if` receipt is deleted.
- [ ] `packages/activerecord/src/connection-adapters/schema-cache.test.ts` and `schema-cache.trails.test.ts` stay green, including the yaml and marshal round trips.
