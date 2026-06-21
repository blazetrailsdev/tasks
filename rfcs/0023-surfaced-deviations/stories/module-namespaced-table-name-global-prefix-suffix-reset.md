---
title: "module-namespaced-table-name-global-prefix-suffix-reset"
status: claimed
updated: 2026-06-21
rfc: "0023-surfaced-deviations"
cluster: null
deps: []
deps-rfc: []
est-loc: null
priority: null
pr: null
claim: "2026-06-21T17:13:54Z"
assignee: "module-namespaced-table-name-global-prefix-suffix-reset"
blocked-by: null
---

## Context

Story `module-namespaced-table-name-nested-and-prefix` implemented the
`compute_table_name` contained arm and module-level `table_name_prefix` /
`table_name_suffix` (model_schema.rb:302-304, 606-620) via a module registry in
`inheritance.ts` (`registerModuleTableName{Prefix,Suffix}`) and
`resolveTableName` in `model-schema.ts`.

It left two Rails `modules_test.rb` tests skipped because they mutate the
**global** `ActiveRecord::Base.table_name_prefix` / `table_name_suffix` and then
call `reset_table_name` on a fixed class list:

- `test_module_table_name_prefix_with_global_prefix` (modules_test.rb:95-114)
- `test_module_table_name_suffix_with_global_suffix` (modules_test.rb:123-143)

These are skipped in `packages/activerecord/src/modules.test.ts` with a pointer
to this story. Global mutation under shared-worker parallel fixtures is the
hazard; also trails declares `MyApplication::Business::Company` as an STI
subclass of top-level `Company` (not `< Base` as Rails does), so the global
prefix flows through the STI base — verify that interaction.

## Acceptance criteria

- Un-skip both tests in `modules.test.ts`, asserting the Rails values
  (`global_companies`, `prefixed_companies`, `companies` for the prefix case;
  `companies_global`, `companies_suffixed`, `companies` for the suffix case).
- Set/reset `Base.tableNamePrefix` / `tableNameSuffix` and call `resetTableName`
  on the class list exactly as Rails does, restoring globals in a `finally`.
- Run isolated so global mutation can't poison sibling files (own suite / serial).
- Test names match Rails verbatim. Run only touched files.
