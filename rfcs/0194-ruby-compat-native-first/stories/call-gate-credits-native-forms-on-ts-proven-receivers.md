---
title: "Call gate credits native empty?/except forms on TS-proven receivers; convert the remaining sites"
status: claimed
updated: 2026-10-25
rfc: "0194-ruby-compat-native-first"
cluster: null
packages: []
deps: []
deps-rfc: []
est-loc: 200
priority: null
pr: null
claim: "2026-10-25T14:48:34Z"
assignee: "connection-base-new-tagged-logger-invented-function-arm"
blocked-by: null
closed-reason: null
---

## Context

trails#9268 had to keep `isEmpty` / `except` at about 30 sites whose TS receiver is typed as an array or a plain `Record`. The reason is that `significantCallsForReceivers` (`scripts/api-compare/compare.ts`, `SIZE_ANALOGUES` / `SIZED_RECEIVER_KINDS`) credits a native `.length` or rest-destructure only where Ripper proved the Ruby receiver kind. An ivar or a method-call receiver (`@values.except`, `joins_values.empty?`, `options.except` in `activemodel/lib/active_model/validations/*.rb`) is never proven, so converting the site adds a call-mismatch row.

The sites are:

- `relation/query-methods.ts`: `build_joins`, `build_join_buckets`, `build_join_dependencies`, `build_subquery`, `build_with`, `order_column`.
- `relation.ts`: `compute_cache_version`, `references_eager_loaded_tables?`, `scope_for_create`, `values_for_queries`.
- `insert-all.ts`: `initialize`, `configure_on_duplicate_update_logic`.
- `calculations#select_for_count`, `finder_methods#ordered_relation`, `collection_association#ids_reader`, `disable_joins_association_scope#add_constraints`, `reaper#spawn_thread`, `extended_deterministic_queries#process_arguments`, `association_query_value#select_clause?`, `polymorphic_array_value#queries`, `schema_statements#can_remove_index_by_name?`, `wildcard_resolver#resolve`.
- The `except` calls in the acceptance, confirmation, exclusion, inclusion and AR uniqueness validators.

## Acceptance criteria

- [ ] The call gate credits `.length` / `Object.keys(h).length` for `empty?` / `size`, and a literal-key rest-destructure for `except`, where the TS checker proves the receiver is a string, array or plain-object type, even when the Ruby kind is unproven.
- [ ] The sites listed above are converted to the native form, with no new call-mismatch or call-args rows.
