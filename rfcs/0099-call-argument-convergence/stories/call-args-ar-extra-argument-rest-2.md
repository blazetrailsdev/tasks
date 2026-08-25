---
title: "call-args-ar-extra-argument-rest-2"
status: done
updated: 2026-08-12
rfc: "0099-call-argument-convergence"
cluster: null
packages: []
deps: []
deps-rfc: []
est-loc: null
priority: null
pr: 6409
claim: "2026-08-12T12:26:11Z"
assignee: "call-args-ar-extra-argument-rest-2"
blocked-by: null
closed-reason: null
---

# Converge the structural extra-argument call sites left by PR #6406

## Context

Third slice of RFC 0099 bucket (a). `call-args-ar-extra-argument` (PR #6398)
converged 13 rows; `call-args-ar-extra-argument-rest` (PR #6406) converged 15
more — every site whose fix was a plain receiver-as-`this` conversion
(`nested-attributes.ts`, `autosave-association.ts`, `scoping/default.ts`,
`encryption/encryptable-record.ts`).

What remains are the rows whose fix is a STRUCTURAL change, one per cluster.
Regenerate the current list with `pnpm parity:api:calls:args` and
`scripts/api-compare/output/call-arg-mismatches.json` (filter
`package == "activerecord" && class == "shape"`).

**(1) Receiver-as-first-argument, but the whole helper chain in the file has to
move together.** Fix: `this`-typed function or real method (CLAUDE.md "Module
mixins"), same as PR #6406.

- `associations/collection-association.ts` `callback` → `callbacks_for(ref:method)` vs `(ref:assoc, ref:kind)`
- `associations/collection-association.ts` `replace_common_records_in_memory` → `replace_on_target(ref:record, ref:skipCallbacks, kwargs{replace=bool:true})` vs `(ref:assoc, ref:record, bool:true, bool:true)`
- `inheritance.ts` — 6 rows (`sti_class_for`, `polymorphic_class_for`, `find_sti_class`, `subclass_from_attributes`, `type_condition`, `finder_needs_type_condition?`), all `(ref:modelClass, …)`. Widest fan-out of the set: the free functions are imported across the package.
- `relation/calculations.ts` `perform_calculation` → `distinct_select?`, `execute_grouped_calculation`, `execute_simple_calculation`, `select_for_count` — all take `ref:rel` first.
- `store.ts` `store_accessor` → `read_store_attribute(ref:storeAttribute, ref:key)` / `write_store_attribute(…, ref:value)`, plus `store_accessor_for`. NOTE the behavioural rider: the port's extra `declaringClass` exists so a subclass instance resolves the accessor of the class where `store()` was declared — the receiver conversion has to carry the same resolution.
- `connection-adapters/abstract/connection-pool.ts` `attempt_to_checkout_all_existing_connections` → `checkout_for_exclusive_access(ref:remainingTimeout)`; `with_new_connections_blocked` → `bulk_make_new_connections(ref:numNewConnsRequired)`
- `table-metadata.ts`, `touch-later.ts`, `insert-all.ts`, `token-for.ts`, `counter-cache.ts`, `middleware/shard-selector.ts`, `relation/predicate-builder/*.ts`, `associations/preloader/branch.ts` — one row each, same shape.

**(2) Constructor given its fields instead of the value object Rails builds.**

- `associations/alias-tracker.ts` `create` → `new(ref:tableAliasLength, ref:aliases)` vs `(…, ref:joins, ref:quoter)`. Blocked on the lazy-count design: Rails puts `initial_count_for` in the aliases Hash's `default_proc` (`alias_tracker.rb:9-25`); trails keeps `joins`/`quoter` on the tracker and computes in `_getCount`. Converging means moving the lazy count into the map.
- `connection-adapters/abstract/schema-definitions.ts` `add_column` → `new(ref:newColumnDefinition)` vs `(ref:name, ref:type, ref:options)`
- `connection-adapters/mysql2/database-statements.ts` `cast_result` → `new(ref:fields, ref:toA)` vs `(ref:columns, ref:rows, ref:columnTypes)`
- `reflection.ts` `check_validity_of_inverse!` — 2 rows. Converge by giving `InverseOfAssociationNotFoundError` / `InverseOfAssociationRecursiveError` the Rails constructor `(reflection, associated_class = nil)` and moving the `corrections` / message derivation into the error (`associations/errors.rb:33-72`).
- `tasks/database-tasks.ts` `check_current_protected_environment!` → `new(kwargs{current,stored})` vs `(ref:current, ref:stored)`
- `relation.ts` / `relation/batches.ts` `in_batches` → `new(kwargs{cursor,finish,of,order,relation,start,useRanges})` vs `(ref:batchSize, kwargs{finish,relation,start})`
- `migration.ts` ×2, `signed-id.ts`, `statement-cache.ts` ×2, `attribute-methods.ts`, `store.ts` `as_indifferent_hash` — one row each.

**(3) An extra collaborator threaded through.**

- `associations/association-scope.ts` `add_constraints` → `last_chain_scope(ref:scope, ref:last, ref:owner)` vs `(…, ref:klass)`
- `associations/join-dependency.ts` `build` → `build(ref:right, ref:klass)` vs `(ref:child, ref:baseKlass, ref:effectiveSqlName, ref:childPath)`
- `connection-adapters/abstract/connection-handler.ts` `establish_connection` → `resolve_pool_config(…)` vs `(…, kwargs{adapterFactory})` (plus the matching `resolve_pool_config` → `new` row)
- `tasks/database-tasks.ts` `structure_dump` / `structure_load` → `(ref:filename, ref:flags)` vs `(ref:dbConfig, …, ref:root)`. Rails builds the task instance in `database_adapter_for(db_config, *arguments)` (`tasks/database_tasks.rb:362-374`) and calls the two-argument method on it; the port keeps a stateless handler and re-threads config+root per call, so converging means `databaseAdapterFor` returning a constructed task. That one change also covers the `create` / `drop` / `charset` / `collation` / `purge` / `dump_schema` rows in the same file.
- `tasks/mysql-database-tasks.ts` `structure_load` → `run_cmd(str:mysql, ref:args, str:loading)` vs `(…, ref:stdin)`
- `validations/uniqueness.ts` — 4 rows (`find_finder_class_for`, `build_relation`, `scope_relation`, `covered_by_unique_index?`)
- `connection-adapters/abstract/schema-statements.ts` / `postgresql-adapter.ts` `data_source_sql` — a leading `nil` the port passes where Rails passes none (3 rows).
- `testing/query-assertions.ts` `subscribed` ×2 — argument ORDER differs from `assert_queries_count` (`test_case.rb`).

**(4) Ruby block ported as a named callback identifier.** The extractor drops an
INLINE arrow but counts a bare identifier, so passing the callback inline
converges these for free (that is how `abstract/query-cache.ts` and
`relation/query-methods.ts` were fixed in PR #6398).

- `associations/preloader/through-association.ts` `source_records_by_owner` / `through_records_by_owner` → `reduce(str:merge)` vs `(ref:merge, ref:constructor)`. Ruby's `reduce(:merge)` takes NO initial value and returns nil for an empty array; the port passes `new Map()`. Converging needs the empty-array arm handled explicitly, since JS `reduce` with no initial value throws.
- `relation/query-methods.ts` `build_where_clause` → `build_from_hash(ref:opts)` vs `(ref:normalized, ref:block)`; `arel_column_with_table` → `resolve_arel_attribute(…, ref:block)`
- `middleware/database-selector/resolver.ts` `read` → `read_from_primary?()` vs `(ref:blk)`

## Acceptance criteria

1. Each converged call site passes what the Rails body passes, verified against
   the vendored Rails file named on the row.
2. The corresponding baseline rows are DELETED by hand (only-shrink; never
   `--write`).
3. `pnpm parity:api:calls:args` and `pnpm parity:api:calls` are green.
4. Anything that genuinely cannot converge keeps a reviewed one-line `reason`
   naming the Rails `file:line` and the blocker — never the seeded placeholder.
5. Split across as many PRs as the LOC ceiling requires; each PR from `main`
   with non-overlapping files. The clusters above are already grouped so that
   one cluster is roughly one PR.
