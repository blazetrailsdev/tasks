---
title: "Port the instance/class-seat rows surfaced by level-keyed expected set"
status: draft
updated: 2026-09-21
rfc: "0156-parity-beyond-name-presence"
cluster: null
packages: []
deps: []
deps-rfc: []
est-loc: 400
priority: null
pr: null
claim: null
assignee: null
blocked-by: null
closed-reason: null
---

## Context

trails#7936 (`key-expected-set-on-level-and-name`) split each Ruby file's expected set into a class row and an instance row. About 227 rows across 12 packages now read as missing. The largest class is `class_attribute` / `mattr_accessor` / `cattr_accessor` accessors. Rails defines both a class reader/writer and an instance reader (and a `?` predicate) for these (`activesupport/lib/active_support/core_ext/class/attribute.rb`, `instance_reader: true` / `instance_predicate: true` defaults). Trails ports only the static half (e.g. `base.ts` statics).

Examples (activerecord):

- `core.rb` `ActiveRecord::Core#attributes_for_inspect`
- `core.rb` `ActiveRecord::Core#default_connection_handler`
- `core.rb` `ActiveRecord::Core#default_connection_handler?`
- `core.rb` `ActiveRecord::Core#default_role`
- `core.rb` `ActiveRecord::Core#default_role?`
- `core.rb` `ActiveRecord::Core#default_shard?`
- `core.rb` `ActiveRecord::Core#destroy_association_async_batch_size`
- `core.rb` `ActiveRecord::Core#logger`
- `core.rb` `ActiveRecord::Core#logger?`
- `inheritance.rb` `ActiveRecord::Inheritance#store_full_class_name`
- `inheritance.rb` `ActiveRecord::Inheritance#store_full_class_name?`
- `inheritance.rb` `ActiveRecord::Inheritance#store_full_sti_class`
- `inheritance.rb` `ActiveRecord::Inheritance#store_full_sti_class?`
- `integration.rb` `ActiveRecord::Integration#cache_timestamp_format`
- `integration.rb` `ActiveRecord::Integration#cache_timestamp_format?`
- `integration.rb` `ActiveRecord::Integration#cache_versioning`
- `integration.rb` `ActiveRecord::Integration#cache_versioning?`
- `integration.rb` `ActiveRecord::Integration#collection_cache_versioning`
- `integration.rb` `ActiveRecord::Integration#collection_cache_versioning?`
- `locking/optimistic.rb` `ActiveRecord::Locking::Optimistic#lock_optimistically`
- `locking/optimistic.rb` `ActiveRecord::Locking::Optimistic#lock_optimistically?`
- `model_schema.rb` `ActiveRecord::ModelSchema#pluralize_table_names`
- `model_schema.rb` `ActiveRecord::ModelSchema#pluralize_table_names?`
- `model_schema.rb` `ActiveRecord::ModelSchema#primary_key_prefix_type`
- `model_schema.rb` `ActiveRecord::ModelSchema#primary_key_prefix_type?`

The full per-package list is in the trails#7936 PR body, under "Newly missing rows".

## Acceptance criteria

- Each listed `class_attribute` instance reader/predicate is ported on the instance side. Use `classAttribute()` from `@blazetrails/activesupport` (which already generates the instance reader), so the row matches on the instance seat.
- Non-accessor rows (e.g. `ActiveModel::Naming` `param_key`/`singular`/…, `GlobalID.find`/`app`, `Mime.symbols`) are ported on the seat Rails defines them on, or split into their own story.
- `parity:api` matched count rises by the rows converged; nothing is baselined.
