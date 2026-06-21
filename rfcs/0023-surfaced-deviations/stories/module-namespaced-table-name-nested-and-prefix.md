---
title: "Module table_name: nested-AR-class contained prefix + module table_name_prefix"
status: done
updated: 2026-06-21
rfc: "0023-surfaced-deviations"
cluster: null
deps:
  - module-namespaced-sti-polymorphic-name
deps-rfc: []
est-loc: 180
priority: null
pr: 3777
claim: "2026-06-21T11:26:41Z"
assignee: "module-namespaced-table-name-nested-and-prefix"
blocked-by: null
---

## Context

Module nesting does NOT change a Rails table name in the common case
(`undecorated_table_name` demodulizes), but there are two exceptions trails
doesn't implement:

- `compute_table_name`
  (vendor/rails/activerecord/lib/active_record/model_schema.rb:606-620): when
  `module_parent < Base && !module_parent.abstract_class?` it prepends the
  singularized parent table — `Client::Contact` → `client_contacts`.
- `full_table_name_prefix` (model*schema.rb:302-304): walks `module_parents` for
  the first responding to `table_name_prefix` and uses the **module's** prefix —
  `module Admin; def self.table_name_prefix; "admin*"; end`→`admin_users`.

trails `resolveTableName` (model-schema.ts:42-54) only does
`pluralize(underscore(this.name))` + the model-level `_tableNamePrefix`; it has
no module prefix and no nested-AR-class `contained` arm.
`undecoratedTableName` (model-schema.ts:1447-1450) demodulizes via `.pop()`.

Today `company-in-module.ts` hand-pins `static _tableName` everywhere to mask
this (`MyAppBusinessClientContact`, `Prefixed::*`, `Suffixed::*`).

Depends on Story `module-namespaced-sti-polymorphic-name` for the `moduleName`
carrier. See audit:
~/.btwhooks/data/github/blazetrailsdev/trails/audits/module-namespaced-models-20260620T121611Z.md

## Acceptance criteria

- `resolveTableName`/`undecoratedTableName` implement the `module_parent < Base`
  `contained` (singularized parent table) prefix.
- Implement module-level `table_name_prefix` (a module-prefix marker
  co-located with `moduleName`, e.g. `static moduleTableNamePrefix`, or a small
  module registry) feeding `full_table_name_prefix` semantics.
- Convert `company-in-module.ts` to drop hand-pinned `_tableName` wherever the
  rule now derives it (`Client::Contact` → `client_contacts`, prefixed cases).
- Tests mirror Rails `company_in_module` table-name parity.
- If the module-`table_name_prefix` arm pushes the PR over 500 LOC, split it
  into a separate follow-up story rather than breaching the ceiling.
- Mirror Rails test names; run only touched files.
