---
title: "mysql-server-version duplicates the four AdapterHelper supports_*? predicates as constants"
status: in-progress
updated: 2026-09-15
rfc: "0110-parity-skip-register-correctness"
cluster: null
packages: []
deps: []
deps-rfc: []
est-loc: 40
priority: null
pr: trails#7819
claim: "2026-09-15T19:06:39Z"
assignee: "dedupe-mysql-server-version-supports-constants"
blocked-by: null
closed-reason: null
---

## Context

trails#7780 ported `AdapterHelper#supports_default_expression?` /
`supports_non_unique_constraint_name?` / `supports_text_column_with_default?` /
`supports_sql_standard_drop_constraint?` (`activerecord/test/support/adapter_helper.rb:23-64`)
as functions in `packages/activerecord/src/support/adapter-helper.ts`. The same
four version checks still exist a second time as module constants in
`packages/activerecord/src/support/mysql-server-version.ts`
(`supportsDefaultExpression`, `supportsTextColumnWithDefault`,
`supportsNonUniqueConstraintName`, `supportsSqlStandardDropConstraint`), read by
`adapters/abstract-mysql-adapter/test-helper.ts` and `migration/columns.test.ts`.
Rails has one definition per predicate, on `AdapterHelper`.

## Acceptance criteria

1. Callers of the four `mysql-server-version.ts` constants call the
   `adapter-helper.ts` ports instead (Rails' `supports_*?` from `AdapterHelper`).
2. The four duplicate constants are deleted from `mysql-server-version.ts`.
3. `columns.test.ts` and the abstract-mysql-adapter tests stay green on MySQL/MariaDB.
