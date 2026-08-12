---
title: "Converge the 47 activerecord call sites that pass an extra argument Rails does not"
status: done
updated: 2026-08-12
rfc: "0099-call-argument-convergence"
cluster: null
packages: ["activerecord"]
deps: []
deps-rfc: []
est-loc: 564
priority: null
pr: 6398
claim: "2026-08-12T02:35:05Z"
assignee: "call-args-ar-extra-argument"
blocked-by: null
closed-reason: null
---

## Context

Filed by the RFC 0099 classification pass over the 410 `activerecord`
`kind: "args"` rows of the RFC 0095 call-argument baseline — bucket (a),
genuine divergence. 47 rows across 28 files.

Each site passes MORE arguments than Rails — an extra collaborator threaded through (a quoter, a pool, a parsed SQL string) or a constructor given its fields instead of the value object Rails builds. Converge each callee's signature to Rails' and drop the extra argument.

Rows live in `scripts/api-compare/call-mismatches-exclude/activerecord/**.json`
with `kind: "args"`, keyed `package + tsFile + rubyName + call + rubyArgs`.

### Rows

- `associations/alias-tracker.ts` `create` → `new`: Rails (`associations/alias_tracker.rb`) `(ref:tableAliasLength, ref:aliases)` vs trails `(ref:tableAliasLength, ref:map, ref:joins, ref:quoter)`
- `associations/association-scope.ts` `add_constraints` → `last_chain_scope`: Rails (`associations/association_scope.rb`) `(ref:scope, ref:last, ref:owner)` vs trails `(ref:scope, ref:last, ref:owner, ref:klass)`
- `associations/collection-association.ts` `callback` → `callbacks_for`: Rails (`associations/collection_association.rb`) `(ref:method)` vs trails `(ref:assoc, ref:kind)`
- `associations/collection-association.ts` `replace_common_records_in_memory` → `replace_on_target`: Rails (`associations/collection_association.rb`) `(ref:record, ref:skipCallbacks, kwargs{replace=bool:true})` vs trails `(ref:assoc, ref:record, bool:true, bool:true)`
- `associations/join-dependency.ts` `build` → `build`: Rails (`associations/join_dependency.rb`) `(ref:right, ref:klass)` vs trails `(ref:child, ref:baseKlass, ref:effectiveSqlName, ref:childPath)`
- `associations/preloader/through-association.ts` `source_records_by_owner` → `reduce`: Rails (`associations/preloader/through_association.rb`) `(str:merge)` vs trails `(ref:merge, ref:constructor)`
- `associations/preloader/through-association.ts` `through_records_by_owner` → `reduce`: Rails (`associations/preloader/through_association.rb`) `(str:merge)` vs trails `(ref:merge, ref:constructor)`
- `autosave-association.ts` `define_autosave_validation_callbacks` → `define_non_cyclic_method`: Rails (`autosave_association.rb`) `(ref:validationMethod)` vs trails `(ref:klass, ref:validationName)`
- `connection-adapters/abstract-mysql-adapter.ts` `mismatched_foreign_key` → `mismatched_foreign_key_details`: Rails (`connection_adapters/abstract_mysql_adapter.rb`) `(kwargs{message=ref:message,sql=ref:sql})` vs trails `(ref:message, ref:sql)`
- `connection-adapters/abstract-mysql-adapter.ts` `mismatched_foreign_key` → `mismatched_foreign_key_details`: Rails (`connection_adapters/abstract_mysql_adapter.rb`) `(kwargs{message=ref:message,sql=ref:sql})` vs trails `(ref:message, ref:parsedSql)`
- `connection-adapters/abstract/connection-handler.ts` `establish_connection` → `resolve_pool_config`: Rails (`connection_adapters/abstract/connection_handler.rb`) `(ref:config, ref:ownerName, ref:role, ref:shard)` vs trails `(ref:config, ref:ownerName, ref:role, ref:shard, kwargs{adapterFactory=ref:adapterFactory})`
- `connection-adapters/abstract/connection-pool.ts` `attempt_to_checkout_all_existing_connections` → `checkout_for_exclusive_access`: Rails (`connection_adapters/abstract/connection_pool.rb`) `(ref:remainingTimeout)` vs trails `(ref:pool, ref:checkoutTimeout)`
- `connection-adapters/abstract/connection-pool.ts` `with_new_connections_blocked` → `bulk_make_new_connections`: Rails (`connection_adapters/abstract/connection_pool.rb`) `(ref:numNewConnsRequired)` vs trails `(ref:pool, ref:need)`
- `connection-adapters/abstract/query-cache.ts` `cache_sql` → `compute_if_absent`: Rails (`connection_adapters/abstract/query_cache.rb`) `(ref:key)` vs trails `(ref:key, ref:block)`
- `connection-adapters/abstract/schema-definitions.ts` `add_column` → `new`: Rails (`connection_adapters/abstract/schema_definitions.rb`) `(ref:newColumnDefinition)` vs trails `(ref:name, ref:type, ref:options)`
- `connection-adapters/mysql2/database-statements.ts` `cast_result` → `new`: Rails (`connection_adapters/mysql2/database_statements.rb`) `(ref:fields, ref:toA)` vs trails `(ref:columns, ref:rows, ref:columnTypes)`
- `counter-cache.ts` `update_counters` → `update_counters`: Rails (`counter_cache.rb`) `(ref:counters)` vs trails `(ref:counters, ref:options)`
- `encryption/cipher.ts` `encrypt` → `encrypt`: Rails (`encryption/cipher.rb`) `(ref:cleanText)` vs trails `(ref:clearText, ref:options)`
- `encryption/encryptable-record.ts` `add_length_validation_for_encrypted_columns` → `validate_column_size`: Rails (`encryption/encryptable_record.rb`) `(ref:attributeName)` vs trails `(ref:modelClass, ref:name)`
- `encryption/encryptable-record.ts` `build_decrypt_attribute_assignments` → `ciphertext_for`: Rails (`encryption/encryptable_record.rb`) `(ref:attributeName)` vs trails `(ref:record, ref:name)`
- `encryption/encryptable-record.ts` `preserve_original_encrypted` → `override_accessors_to_preserve_original`: Rails (`encryption/encryptable_record.rb`) `(ref:name, ref:originalAttributeName)` vs trails `(ref:modelClass, ref:name, ref:originalName)`
- `inheritance.ts` `subclass_from_attributes` → `find_sti_class`: Rails (`inheritance.rb`) `(ref:subclassName)` vs trails `(ref:modelClass, ref:value)`
- `nested-attributes.ts` `assign_nested_attributes_for_collection_association` → `reject_new_record?`: Rails (`nested_attributes.rb`) `(ref:associationName, ref:attributes)` vs trails `(ref:record, ref:associationName, ref:a)`
- `reflection.ts` `check_validity_of_inverse!` → `new`: Rails (`reflection.rb`) `(ref:this)` vs trails `(ref:name, ref:inverseOf, ref:corrections, ref:className)`
- `reflection.ts` `check_validity_of_inverse!` → `new`: Rails (`reflection.rb`) `(ref:this)` vs trails `(ref:name, ref:name, ref:className)`
- `relation.ts` `in_batches` → `new`: Rails (`relation.rb`) `(kwargs{cursor=ref:cursor,finish=ref:finish,of=ref:of,order=ref:order,relation=ref:this,start=ref:start,useRanges=ref:useRanges})` vs trails `(ref:batchSize, kwargs{finish=ref:finish,relation=ref:this,start=ref:start})`
- `relation.ts` `in_batches` → `new`: Rails (`relation/batches.rb`) `(kwargs{cursor=ref:cursor,finish=ref:finish,of=ref:of,order=ref:order,relation=ref:this,start=ref:start,useRanges=ref:useRanges})` vs trails `(ref:batchSize, kwargs{finish=ref:finish,relation=ref:this,start=ref:start})`
- `relation/calculations.ts` `perform_calculation` → `distinct_select?`: Rails (`relation/calculations.rb`) `(ref:columnName)` vs trails `(ref:rel, ref:column)`
- `relation/calculations.ts` `perform_calculation` → `execute_grouped_calculation`: Rails (`relation/calculations.rb`) `(ref:operation, ref:columnName, ref:distinct)` vs trails `(ref:rel, ref:op, ref:column, ref:distinct)`
- `relation/calculations.ts` `perform_calculation` → `execute_simple_calculation`: Rails (`relation/calculations.rb`) `(ref:operation, ref:columnName, ref:distinct)` vs trails `(ref:rel, ref:op, ref:column, ref:distinct)`
- `relation/finder-methods.ts` `find_some` → `raise_record_not_found_exception!`: Rails (`relation/finder_methods.rb`) `(ref:ids, ref:size, ref:expectedSize)` vs trails `(ref:ids, ref:length, ref:expectedSize, ref:pk)`
- `relation/finder-methods.ts` `find_some_ordered` → `raise_record_not_found_exception!`: Rails (`relation/finder_methods.rb`) `(ref:ids, ref:size, ref:size)` vs trails `(ref:ids, ref:length, ref:length, ref:pk)`
- `relation/query-methods.ts` `arel_column_with_table` → `resolve_arel_attribute`: Rails (`relation/query_methods.rb`) `(ref:tableName, ref:columnName)` vs trails `(ref:tableName, ref:colStr, ref:block)`
- `relation/query-methods.ts` `build_where_clause` → `build_from_hash`: Rails (`relation/query_methods.rb`) `(ref:opts)` vs trails `(ref:normalized, ref:block)`
- `scoping/default.ts` `ignore_default_scope?` → `ignore_default_scope`: Rails (`scoping/default.rb`) `(ref:baseClass)` vs trails `(ref:modelClass, bool:true)`
- `statement-cache.ts` `partial_query` → `new`: Rails (`statement_cache.rb`) `(ref:values)` vs trails `(ref:values, ref:options)`
- `statement-cache.ts` `query` → `new`: Rails (`statement_cache.rb`) `(ref:sql)` vs trails `(ref:sql, ref:options)`
- `store.ts` `store_accessor` → `read_store_attribute`: Rails (`store.rb`) `(ref:storeAttribute, ref:key)` vs trails `(ref:this, ref:attribute, ref:accessor, ref:declaringClass)`
- `store.ts` `store_accessor` → `write_store_attribute`: Rails (`store.rb`) `(ref:storeAttribute, ref:key, ref:value)` vs trails `(ref:this, ref:attribute, ref:accessor, ref:value, ref:declaringClass)`
- `tasks/database-tasks.ts` `check_current_protected_environment!` → `new`: Rails (`tasks/database_tasks.rb`) `(kwargs{current=ref:current,stored=ref:stored})` vs trails `(ref:current, ref:stored)`
- `tasks/database-tasks.ts` `migrate_all` → `migrate`: Rails (`tasks/database_tasks.rb`) `(kwargs{skipInitialize=bool:true})` vs trails `(nil, kwargs{skipInitialize=bool:true,targetVersion=ref:targetVersion})`
- `tasks/database-tasks.ts` `structure_dump` → `structure_dump`: Rails (`tasks/database_tasks.rb`) `(ref:filename, ref:flags)` vs trails `(ref:config, ref:filename, ref:flags, ref:root)`
- `tasks/database-tasks.ts` `structure_load` → `structure_load`: Rails (`tasks/database_tasks.rb`) `(ref:filename, ref:flags)` vs trails `(ref:config, ref:filename, ref:flags, ref:root)`
- `tasks/mysql-database-tasks.ts` `structure_load` → `run_cmd`: Rails (`tasks/mysql_database_tasks.rb`) `(str:mysql, ref:args, str:loading)` vs trails `(str:mysql, ref:args, str:loading, ref:stdin)`
- `validations/uniqueness.ts` `validate_each` → `build_relation`: Rails (`validations/uniqueness.rb`) `(ref:finderClass, ref:attribute, ref:value)` vs trails `(ref:modelClass, ref:attribute, ref:mapped, ref:options)`
- `validations/uniqueness.ts` `validate_each` → `find_finder_class_for`: Rails (`validations/uniqueness.rb`) `(ref:record)` vs trails `(ref:record, ref:_klass)`
- `validations/uniqueness.ts` `validate_each` → `scope_relation`: Rails (`validations/uniqueness.rb`) `(ref:record, ref:relation)` vs trails `(ref:record, ref:relation, ref:options)`

## Acceptance criteria

1. Each call site above passes what the Rails body passes, verified against
   the vendored Rails file named on the row.
2. The corresponding baseline rows are DELETED (only-shrink: a converged row
   goes stale and reds the gate until removed by hand — never `--write`).
3. `pnpm parity:api:calls:args` and `pnpm parity:api:calls` are green.
4. Anything that genuinely cannot converge keeps a reviewed one-line `reason`
   naming the Rails `file:line` and the blocker — never the seeded placeholder.
