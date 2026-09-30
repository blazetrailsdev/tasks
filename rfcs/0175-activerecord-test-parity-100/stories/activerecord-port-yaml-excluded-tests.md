---
title: "activerecord: port coders/yaml_column_test.rb and the 23 YAML/Psych-excluded cases"
status: ready
updated: 2026-09-30
rfc: "0175-activerecord-test-parity-100"
cluster: unported-tests
packages: ["activerecord"]
deps:
  [
    "yaml-column-safe-coder-through-psych",
    "schema-cache-dump-and-load-through-psych",
    "relation-to-yaml-psych-dump",
  ]
deps-rfc: []
est-loc: 500
priority: null
pr: null
claim: null
assignee: null
blocked-by: null
closed-reason: null
---

## Context

YAML exclusions (plus the whole-file `coders/yaml_column_test.rb`):

- `coders/yaml_column_test.rb` — (whole file)
  reason: YAML column coder. The store-column dump/load path and the Psych safe-dump class restriction are ported (coders/yaml-column.ts, backed by the `yaml` package — `store :col, coder: "YAML"`), but the Psych-specific safe-LOA
- `query_cache_test.rb` — "query serialized active record"; "query serialized string"
  reason: Ruby YAML `serialize` coder round-trip of an AR record (use_yaml_unsafe_load); no JS YAML AR-record (un)safe-load equivalent.
- `serialized_attribute_test.rb` — "serialized class attribute"; "serialized class does not become frozen"; "serialized attribute should raise exception on assignment with wrong type"; "classes without no arg constructors are not supported"; "is not changed when stored blob"; "is not changed when stored in blob frozen payload"; "decorated type with type for attribute"; "decorated type with decorator block" …
  reason: YAML/Psych column serialization and class-constrained serializers — Ruby-only format with no Node.js equivalent.
- `serialized_attribute_test.rb` — "serialized attribute with class constraint"; "where by serialized attribute with array"; "where by serialized attribute with hash"; "where by serialized attribute with hash in array"; "serialize attribute can be serialized in an integer column"; "serialized time attribute"
  reason: Psych safe_load re-run of tests the base class ports live; only the permitted-classes YAML arm has no Node.js equivalent.
- `serialized_attribute_test.rb` — "serialize attribute via select method when time zone available"
  reason: Serializes a Ruby MyObject through Psych under aware_attributes; the subclass's Hash-typed rewrite of the same test is ported.
- `attribute_methods_test.rb` — "YAML dumping a record with time zone-aware attribute"
  reason: Round-trips an Active Record object through `YAML.dump` / `YAML.unsafe_load` (Psych), which reconstitutes the instance from a `!ruby/object:Topic` node carrying its instance variables. No Node.js equivalent: JS has no ob
- `connection_adapters/schema_cache_test.rb` — "yaml loads 5 1 dump"; "yaml loads 5 1 dump without indexes still queries for indexes"
  reason: Loads the fixed Rails-5.1-era schema-cache dump asset (test/assets/schema_dump_5_1.yml) and deserializes it via Psych (schema_cache_test.rb:124-142). Note this is NOT covered by our YAML syntax support (the `yaml` packag

RFC 0170 (Psych in ruby-compat) removes the reason: `yaml-column-safe-coder-through-psych`,
`schema-cache-dump-and-load-through-psych`, `relation-to-yaml-psych-dump` (RFC 0155).

## Acceptance criteria

- [ ] Every case above and `yaml_column_test.rb` ported with Rails' bodies; entries deleted.
