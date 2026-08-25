---
title: "call-args-ar-extra-argument-rest"
status: done
updated: 2026-08-12
rfc: "0099-call-argument-convergence"
cluster: null
packages: []
deps: []
deps-rfc: []
est-loc: null
priority: null
pr: 6406
claim: "2026-08-12T10:26:04Z"
assignee: "call-args-ar-extra-argument-rest"
blocked-by: null
closed-reason: null
---

# Converge the remaining activerecord extra-argument call sites

## Context

Continuation of `call-args-ar-extra-argument` (RFC 0099 bucket (a)). That
story listed 47 `kind: "args"` rows across 28 files where the port passes MORE
arguments than Rails. PR #6398 converged 13 of them (statement-cache ×2,
encryption/cipher, relation/finder-methods ×2, validations/uniqueness ×3,
abstract-mysql-adapter ×2, abstract/query-cache, relation/query-methods ×2,
counter-cache) and deleted their baseline rows; the rest were left because each
needs a structural change larger than one PR's LOC ceiling, and several belong
to the same recurring shape and should be converged together.

The remaining rows, grouped by the convergence they need:

**(1) Module-function-with-receiver-as-first-argument.** The Rails body is an
instance/class method and reads `self`; the port is a free function whose first
parameter is the receiver. Fix: `this`-typed function or real method (CLAUDE.md
"Module mixins"). Converging one call site usually means converting its whole
helper chain in that file.

- `associations/collection-association.ts` `callback` → `callbacks_for(ref:method)` vs `(ref:assoc, ref:kind)`
- `associations/collection-association.ts` `replace_common_records_in_memory` → `replace_on_target(ref:record, ref:skipCallbacks, kwargs{replace=bool:true})` vs `(ref:assoc, ref:record, bool:true, bool:true)`
- `autosave-association.ts` `define_autosave_validation_callbacks` → `define_non_cyclic_method(ref:validationMethod)` vs `(ref:klass, ref:validationName)`
- `encryption/encryptable-record.ts` `add_length_validation_for_encrypted_columns` → `validate_column_size(ref:attributeName)` vs `(ref:modelClass, ref:name)`
- `encryption/encryptable-record.ts` `build_decrypt_attribute_assignments` → `ciphertext_for(ref:attributeName)` vs `(ref:record, ref:name)`
- `encryption/encryptable-record.ts` `preserve_original_encrypted` → `override_accessors_to_preserve_original(ref:name, ref:originalAttributeName)` vs `(ref:modelClass, ref:name, ref:originalName)`
- `inheritance.ts` `subclass_from_attributes` → `find_sti_class(ref:subclassName)` vs `(ref:modelClass, ref:value)`
- `nested-attributes.ts` `assign_nested_attributes_for_collection_association` → `reject_new_record?(ref:associationName, ref:attributes)` vs `(ref:record, ref:associationName, ref:a)`
- `relation/calculations.ts` `perform_calculation` → `distinct_select?(ref:columnName)` vs `(ref:rel, ref:column)`
- `relation/calculations.ts` `perform_calculation` → `execute_grouped_calculation(ref:operation, ref:columnName, ref:distinct)` vs `(ref:rel, ref:op, ref:column, ref:distinct)`
- `relation/calculations.ts` `perform_calculation` → `execute_simple_calculation(ref:operation, ref:columnName, ref:distinct)` vs `(ref:rel, ref:op, ref:column, ref:distinct)`
- `store.ts` `store_accessor` → `read_store_attribute(ref:storeAttribute, ref:key)` vs `(ref:this, ref:attribute, ref:accessor, ref:declaringClass)`
- `store.ts` `store_accessor` → `write_store_attribute(ref:storeAttribute, ref:key, ref:value)` vs `(ref:this, ref:attribute, ref:accessor, ref:value, ref:declaringClass)`
- `connection-adapters/abstract/connection-pool.ts` `attempt_to_checkout_all_existing_connections` → `checkout_for_exclusive_access(ref:remainingTimeout)` vs `(ref:pool, ref:checkoutTimeout)`
- `connection-adapters/abstract/connection-pool.ts` `with_new_connections_blocked` → `bulk_make_new_connections(ref:numNewConnsRequired)` vs `(ref:pool, ref:need)`

Note two of these carry a behavioural rider: `store.ts`'s extra
`declaringClass` exists so a subclass instance resolves the accessor of the
class where `store()` was declared, and `scoping/default.ts`'s `bool:true`
below is `skipInheritedScope` — dropping either changes lookup semantics, so
the receiver conversion has to carry the same resolution.

**(2) Constructor given its fields instead of the value object Rails builds.**

- `associations/alias-tracker.ts` `create` → `new(ref:tableAliasLength, ref:aliases)` vs `(ref:tableAliasLength, ref:map, ref:joins, ref:quoter)`
- `connection-adapters/abstract/schema-definitions.ts` `add_column` → `new(ref:newColumnDefinition)` vs `(ref:name, ref:type, ref:options)`
- `connection-adapters/mysql2/database-statements.ts` `cast_result` → `new(ref:fields, ref:toA)` vs `(ref:columns, ref:rows, ref:columnTypes)`
- `reflection.ts` `check_validity_of_inverse!` → `new(ref:this)` vs `(ref:name, ref:inverseOf, ref:corrections, ref:className)`
- `reflection.ts` `check_validity_of_inverse!` → `new(ref:this)` vs `(ref:name, ref:name, ref:className)`
- `tasks/database-tasks.ts` `check_current_protected_environment!` → `new(kwargs{current,stored})` vs `(ref:current, ref:stored)`
- `relation.ts` / `relation/batches.ts` `in_batches` → `new(kwargs{cursor,finish,of,order,relation,start,useRanges})` vs `(ref:batchSize, kwargs{finish,relation,start})` (two rows, same site)

For `reflection.ts` the converge is to give
`InverseOfAssociationNotFoundError` / `InverseOfAssociationRecursiveError` the
Rails constructor `(reflection, associated_class = nil)` and move the
`corrections` / message derivation into the error
(`vendor/rails/activerecord/lib/active_record/associations/errors.rb:33-72`).

**(3) An extra collaborator threaded through.**

- `associations/association-scope.ts` `add_constraints` → `last_chain_scope(ref:scope, ref:last, ref:owner)` vs `(…, ref:klass)`
- `associations/join-dependency.ts` `build` → `build(ref:right, ref:klass)` vs `(ref:child, ref:baseKlass, ref:effectiveSqlName, ref:childPath)`
- `connection-adapters/abstract/connection-handler.ts` `establish_connection` → `resolve_pool_config(ref:config, ref:ownerName, ref:role, ref:shard)` vs `(…, kwargs{adapterFactory})`
- `scoping/default.ts` `ignore_default_scope?` → `ignore_default_scope(ref:baseClass)` vs `(ref:modelClass, bool:true)`
- `validations/uniqueness.ts` — DONE in PR #6398
- `tasks/database-tasks.ts` `structure_dump` / `structure_load` → `structure_dump(ref:filename, ref:flags)` vs `(ref:config, ref:filename, ref:flags, ref:root)` (two rows). Rails builds the task instance in `database_adapter_for(db_config, *arguments)` (`tasks/database_tasks.rb:362-374`) and then calls the two-argument method on it; the port keeps a stateless handler object and re-threads config+root on every call, so converging means `databaseAdapterFor` returning a constructed task.
- `tasks/database-tasks.ts` `migrate_all` → `migrate(kwargs{skipInitialize=true})` vs `(nil, kwargs{skipInitialize,targetVersion})`
- `tasks/mysql-database-tasks.ts` `structure_load` → `run_cmd(str:mysql, ref:args, str:loading)` vs `(…, ref:stdin)`

**(4) Ruby block ported as a named callback identifier.** The extractor drops
an INLINE arrow (it flags the site `block`, matching Ruby) but counts a bare
identifier. Passing the callback inline converges these for free — that is how
`abstract/query-cache.ts` and `relation/query-methods.ts` were fixed in PR #6398.
Re-check the remaining `ref:block` rows in `call-arg-mismatches.json` for the
same shape:

- `associations/preloader/through-association.ts` `source_records_by_owner` / `through_records_by_owner` → `reduce(str:merge)` vs `(ref:merge, ref:constructor)` (two rows). Ruby's `reduce(:merge)` takes NO initial value and returns nil for an empty array; the port passes `new Map()`. Converging needs the empty-array arm handled explicitly since JS `reduce` with no initial throws.

## Acceptance criteria

1. Each remaining call site above passes what the Rails body passes, verified
   against the vendored Rails file named on the row.
2. The corresponding baseline rows are DELETED by hand (only-shrink; never
   `--write`).
3. `pnpm parity:api:calls:args` and `pnpm parity:api:calls` are green.
4. Anything that genuinely cannot converge keeps a reviewed one-line `reason`
   naming the Rails `file:line` and the blocker — never the seeded placeholder.
5. Split across as many PRs as the LOC ceiling requires; each PR from `main`
   with non-overlapping files.
