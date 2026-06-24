---
title: "ar-schema-creation-quoting"
status: claimed
updated: 2026-06-24
rfc: "0045-data-layer-api-compare-100"
cluster: ar-adapter
deps: []
deps-rfc: []
est-loc: 220
priority: null
pr: null
claim: "2026-06-24T10:00:41Z"
assignee: "ar-schema-creation-quoting"
blocked-by: null
---

## Context

The schema-creation / schema-dump surface misses quoting delegations, support
predicates, drop-constraint visitors, and ignore-pattern accessors:

- `connection-adapters/abstract/schema-creation.ts` (29/37, 8 miss):
  `quote_column_name`, `quote_table_name`, `quote_default_expression`,
  `supports_indexes_in_create?`, `supports_exclusion_constraints?`,
  `supports_unique_constraints?`, `visit_DropForeignKey`,
  `visit_DropCheckConstraint`. In Rails these are
  `delegate … to: :@conn` (`schema_creation.rb:16-19`) plus the `visit_Drop*`
  AST visitors.
- `schema-dumper.ts` (30/36, 6 miss): `chk_ignore_pattern`/`=`,
  `excl_ignore_pattern`/`=`, `unique_ignore_pattern`/`=` (`class_attribute`
  ignore-pattern config).
- `connection-adapters/postgresql/schema-creation.ts`:
  `quoted_include_columns_for_index`.
- `connection-adapters/postgresql-adapter.ts`: `postgresql_version`.

The quoting names delegate to the connection (already ported under another
name); the `supports_*?` predicates and `visit_Drop*` are real adapter methods;
the ignore-pattern accessors are `class_attribute` config.

## Acceptance criteria

- Quoting delegations exposed under the Rails names or skip-listed with reason;
  `supports_*?` predicates and `visit_DropForeignKey`/`visit_DropCheckConstraint`
  ported with a test where the DDL output is observable.
- `quoted_include_columns_for_index`, `postgresql_version`, and the
  `*_ignore_pattern` accessors ported or skip-listed with reason.
- `pnpm api:compare --package activerecord` shows schema-creation.ts,
  schema-dumper.ts, postgresql/schema-creation.ts, postgresql-adapter.ts at
  100%.
