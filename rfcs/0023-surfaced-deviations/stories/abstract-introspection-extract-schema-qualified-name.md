---
title: "Abstract columns()/columnExists fallbacks ignore schema.table qualification (Rails extract_schema_qualified_name)"
status: claimed
updated: 2026-06-21
rfc: "0023-surfaced-deviations"
cluster: null
deps: []
deps-rfc: []
est-loc: 50
priority: null
pr: null
claim: "2026-06-21T13:58:41Z"
assignee: "abstract-introspection-extract-schema-qualified-name"
blocked-by: null
---

## Context

Surfaced in review of #3785 (columns-pg-honor-search-path). The abstract
schema-introspection fallbacks `columns()` and `columnExists()`
(`packages/activerecord/src/connection-adapters/abstract/schema-statements.ts`,
PG branches ~line 532 and ~965) match the table name directly against
`information_schema` (`c.table_name = $1`) without running Rails'
`extract_schema_qualified_name`. A `schema.table` argument is therefore treated
as a single literal table name and will not resolve, unlike Rails'
`quoted_scope` which splits `schema, name = extract_schema_qualified_name(name)`
and scopes `table_schema` to the explicit schema when present
(`activerecord/lib/active_record/connection_adapters/postgresql/schema_statements.rb:1129`).

This is a pre-existing limitation (it existed under the prior hardcoded
`table_schema = 'public'`), not introduced by #3785. The real PG adapter is
unaffected because it overrides `columns()` with `parseSchemaQualifiedName`
(`postgresql/schema-statements-class.ts:531`) and resolves via
`to_regclass`/`relname + nspname`; the gap is only in the abstract switch-based
fallback used by stub/non-overriding adapters.

## Acceptance criteria

- [ ] The abstract PG `columns()` / `columnExists()` fallbacks split a
      `schema.table` argument via an `extract_schema_qualified_name`-equivalent
      and scope `table_schema` to the explicit schema when one is given,
      falling back to `ANY (current_schemas(false))` only for unqualified names
      (matching Rails `quoted_scope`).
- [ ] A test demonstrates the abstract fallback resolves a `schema.table`
      argument correctly.
- [ ] api:compare / test:compare delta non-negative.
