---
title: "Converge the explicit-host argument in ported core module functions (60 rows)"
status: done
updated: 2026-08-12
rfc: "0099-call-argument-convergence"
cluster: null
packages: ["activerecord"]
deps: []
deps-rfc: []
est-loc: 700
priority: null
pr: 6427
claim: "2026-08-12T17:16:56Z"
assignee: "call-args-ar-host-param-core"
blocked-by: null
closed-reason: null
---

## Context

Filed by the RFC 0099 classification pass over the 410 `activerecord`
`kind: "args"` rows of the RFC 0095 call-argument baseline — bucket (a),
genuine divergence. 60 rows across 25 files.

Rails calls these as methods on a receiver (`klass.polymorphic_name`, `assoc.through_reflection`); the trails port calls the module function with the host passed as an explicit first argument, so the argument lists differ by one leading ref. CLAUDE.md's settled mixin idiom is a `this`-typed function assigned to the class, which keeps the call spelled `Klass.polymorphicName()` and the argument list identical to Rails. Converge each site to that shape (or to a plain method call on the host) and delete the corresponding baseline row.

Rows live in `scripts/api-compare/call-mismatches-exclude/activerecord/**.json`
with `kind: "args"`, keyed `package + tsFile + rubyName + call + rubyArgs`.

### Rows

- `attribute-methods.ts` `initialize_generated_modules` → `new`: Rails (`attribute_methods.rb`) `()` vs trails `(ref:name)`
- `attributes.ts` `_default_attributes` → `apply_pending_attribute_modifications`: Rails (`attributes.rb`) `(ref:attributeSet)` vs trails `(ref:cacheHost, ref:attributeSet)`
- `autosave-association.ts` `add_autosave_association_callbacks` → `define_autosave_validation_callbacks`: Rails (`autosave_association.rb`) `(ref:reflection)` vs trails `(ref:model, ref:reflection)`
- `autosave-association.ts` `add_autosave_association_callbacks` → `define_non_cyclic_method`: Rails (`autosave_association.rb`) `(ref:saveMethod)` vs trails `(ref:model, ref:saveMethod)`
- `counter-cache.ts` `_create_record` → `counter_cached_association_names`: Rails (`counter_cache.rb`) `()` vs trails `(ref:constructor)`
- `counter-cache.ts` `destroy_row` → `counter_cached_association_names`: Rails (`counter_cache.rb`) `()` vs trails `(ref:constructor)`
- `inheritance.ts` `discriminate_class_for_record` → `using_single_table_inheritance?`: Rails (`inheritance.rb`) `(ref:record)` vs trails `(ref:modelClass, ref:record)`
- `inheritance.ts` `find_sti_class` → `sti_class_for`: Rails (`inheritance.rb`) `(ref:typeName)` vs trails `(ref:baseClass, ref:typeName)`
- `inheritance.ts` `finder_needs_type_condition?` → `descends_from_active_record?`: Rails (`inheritance.rb`) `()` vs trails `(ref:modelClass)`
- `inheritance.ts` `polymorphic_class_for` → `compute_type`: Rails (`inheritance.rb`) `(ref:name)` vs trails `(ref:modelClass, ref:name)`
- `inheritance.ts` `sti_class_for` → `compute_type`: Rails (`inheritance.rb`) `(ref:typeName)` vs trails `(ref:modelClass, ref:typeName)`
- `inheritance.ts` `type_condition` → `descendants`: Rails (`inheritance.rb`) `()` vs trails `(ref:modelClass)`
- `insert-all.ts` `resolve_sti` → `sti_name`: Rails (`insert_all.rb`) `()` vs trails `(ref:model)`
- `middleware/database-selector/resolver.ts` `read` → `read_from_primary?`: Rails (`middleware/database_selector/resolver.rb`) `()` vs trails `(ref:blk)`
- `middleware/shard-selector.ts` `selected_shard` → `resolver`: Rails (`middleware/shard_selector.rb`) `()` vs trails `(ref:request)`
- `migration.ts` `check_all_pending!` → `new`: Rails (`migration.rb`) `(kwargs{pendingMigrations=ref:migrations})` vs trails `(nil, kwargs{pendingMigrations=ref:migrations})`
- `migration.ts` `check_pending_migrations` → `new`: Rails (`migration.rb`) `(kwargs{pendingMigrations=ref:migrations})` vs trails `(nil, kwargs{pendingMigrations=ref:migrations})`
- `nested-attributes.ts` `accepts_nested_attributes_for` → `define_autosave_validation_callbacks`: Rails (`nested_attributes.rb`) `(ref:reflection)` vs trails `(ref:modelClass, ref:reflection)`
- `nested-attributes.ts` `accepts_nested_attributes_for` → `generate_association_writer`: Rails (`nested_attributes.rb`) `(ref:associationName, ref:type)` vs trails `(ref:modelClass, ref:associationName, ref:type)`
- `nested-attributes.ts` `assign_nested_attributes_for_one_to_one_association` → `call_reject_if`: Rails (`nested_attributes.rb`) `(ref:associationName, ref:attributes)` vs trails `(ref:record, ref:associationName, ref:attributes)`
- `nested-attributes.ts` `assign_nested_attributes_for_one_to_one_association` → `reject_new_record?`: Rails (`nested_attributes.rb`) `(ref:associationName, ref:attributes)` vs trails `(ref:record, ref:associationName, ref:attributes)`
- `nested-attributes.ts` `call_reject_if` → `will_be_destroyed?`: Rails (`nested_attributes.rb`) `(ref:associationName, ref:attributes)` vs trails `(ref:record, ref:associationName, ref:attributes)`
- `nested-attributes.ts` `reject_new_record?` → `call_reject_if`: Rails (`nested_attributes.rb`) `(ref:associationName, ref:attributes)` vs trails `(ref:record, ref:associationName, ref:attributes)`
- `nested-attributes.ts` `reject_new_record?` → `will_be_destroyed?`: Rails (`nested_attributes.rb`) `(ref:associationName, ref:attributes)` vs trails `(ref:record, ref:associationName, ref:attributes)`
- `nested-attributes.ts` `will_be_destroyed?` → `allow_destroy?`: Rails (`nested_attributes.rb`) `(ref:associationName)` vs trails `(ref:record, ref:associationName)`
- `normalization.ts` `normalize` → `normalizer`: Rails (`normalization.rb`) `()` vs trails `(ref:value)`
- `reflection.ts` `inverse_which_updates_counter_cache` → `reflect_on_all_associations`: Rails (`reflection.rb`) `(str:belongsTo)` vs trails `(ref:klass, str:belongsTo)`
- `reflection.ts` `join_scope` → `finder_needs_type_condition?`: Rails (`reflection.rb`) `()` vs trails `(ref:targetKlass)`
- `relation.ts` `cache_key_with_version` → `cache_key`: Rails (`relation.rb`) `()` vs trails `(ref:timestampColumn)`
- `relation.ts` `cache_key_with_version` → `cache_version`: Rails (`relation.rb`) `()` vs trails `(ref:timestampColumn)`
- `relation.ts` `find_by_token_for` → `token_definitions`: Rails (`relation.rb`) `()` vs trails `(ref:model)`
- `relation.ts` `find_by_token_for!` → `token_definitions`: Rails (`relation.rb`) `()` vs trails `(ref:model)`
- `relation/calculations.ts` `perform_calculation` → `distinct_select?`: Rails (`relation/calculations.rb`) `(ref:selectForCount)` vs trails `(ref:rel, ref:selectForCount)`
- `relation/calculations.ts` `perform_calculation` → `select_for_count`: Rails (`relation/calculations.rb`) `()` vs trails `(ref:rel)`
- `relation/delegation.ts` `generate_relation_method` → `generated_relation_methods`: Rails (`relation/delegation.rb`) `()` vs trails `(ref:modelClass)`
- `relation/delegation.ts` `include_relation_methods` → `generated_relation_methods`: Rails (`relation/delegation.rb`) `()` vs trails `(ref:ancestor)`
- `relation/finder-methods.ts` `find_some` → `find_some_ordered`: Rails (`relation/finder_methods.rb`) `(ref:ids)` vs trails `(ref:rel, ref:ids)`
- `relation/finder-methods.ts` `find_with_ids` → `find_some`: Rails (`relation/finder_methods.rb`) `(ref:ids)` vs trails `(ref:rel, ref:ids)`
- `relation/predicate-builder/association-query-value.ts` `ids` → `polymorphic_clause?`: Rails (`relation/predicate_builder/association_query_value.rb`) `()` vs trails `(ref:relation)`
- `relation/predicate-builder/association-query-value.ts` `ids` → `select_clause?`: Rails (`relation/predicate_builder/association_query_value.rb`) `()` vs trails `(ref:relation)`
- `relation/predicate-builder/polymorphic-array-value.ts` `type_to_ids_mapping` → `polymorphic_name`: Rails (`relation/predicate_builder/polymorphic_array_value.rb`) `()` vs trails `(ref:k)`
- `relation/query-methods.ts` `build_join_buckets` → `new`: Rails (`relation/query_methods.rb`) `()` vs trails `(ref:arelSql)`
- `relation/query-methods.ts` `build_with_join_node` → `foreign_key`: Rails (`relation/query_methods.rb`) `()` vs trails `(ref:modelName)`
- `scoping/default.ts` `build_default_scope` → `default_scope_override`: Rails (`scoping/default.rb`) `()` vs trails `(ref:modelClass)`
- `scoping/default.ts` `build_default_scope` → `evaluate_default_scope`: Rails (`scoping/default.rb`) `()` vs trails `(ref:modelClass)`
- `scoping/default.ts` `evaluate_default_scope` → `ignore_default_scope?`: Rails (`scoping/default.rb`) `()` vs trails `(ref:modelClass)`
- `store.ts` `as_indifferent_hash` → `new`: Rails (`store.rb`) `()` vs trails `(ref:obj)`
- `store.ts` `read_store_attribute` → `store_accessor_for`: Rails (`store.rb`) `(ref:storeAttribute)` vs trails `(ref:modelClass, ref:storeAttribute)`
- `store.ts` `stored_attributes` → `stored_attributes`: Rails (`store.rb`) `()` vs trails `(ref:parent)`
- `store.ts` `write_store_attribute` → `store_accessor_for`: Rails (`store.rb`) `(ref:storeAttribute)` vs trails `(ref:modelClass, ref:storeAttribute)`
- `table-metadata.ts` `reflect_on_aggregation` → `reflect_on_aggregation`: Rails (`table_metadata.rb`) `(ref:aggregationName)` vs trails `(ref:_klass, ref:aggregationName)`
- `token-for.ts` `generate_token_for` → `token_definitions`: Rails (`token_for.rb`) `()` vs trails `(ref:constructor)`
- `token-for.ts` `message_verifier` → `generated_token_verifier`: Rails (`token_for.rb`) `()` vs trails `(ref:cls)`
- `token-for.ts` `payload_for` → `block`: Rails (`token_for.rb`) `()` vs trails `(ref:model)`
- `touch-later.ts` `touch_later` → `reflect_on_all_associations`: Rails (`touch_later.rb`) `()` vs trails `(ref:ctor)`
- `validations/uniqueness.ts` `validation_needed?` → `covered_by_unique_index?`: Rails (`validations/uniqueness.rb`) `(ref:klass, ref:record, ref:attribute, ref:scope)` vs trails `(ref:validator, ref:klass, ref:record, ref:attribute, ref:scope)`

## Acceptance criteria

1. Each call site above passes what the Rails body passes, verified against
   the vendored Rails file named on the row.
2. The corresponding baseline rows are DELETED (only-shrink: a converged row
   goes stale and reds the gate until removed by hand — never `--write`).
3. `pnpm parity:api:calls:args` and `pnpm parity:api:calls` are green.
4. Anything that genuinely cannot converge keeps a reviewed one-line `reason`
   naming the Rails `file:line` and the blocker — never the seeded placeholder.
