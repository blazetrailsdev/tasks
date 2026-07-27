---
title: "converge-pg-sequence-and-schema-qualified-name-helpers"
status: in-progress
updated: 2026-07-27
rfc: "0072-api-compare-parity-burndown"
cluster: null
deps: []
deps-rfc: []
est-loc: null
priority: null
pr: 5389
claim: "2026-07-27T01:34:56Z"
assignee: "converge-pg-sequence-and-schema-qualified-name-helpers"
blocked-by: null
closed-reason: null
---

## Context

Fallout cluster from the #5334 include-resolution reseed, surviving the
delegation-transparency gate added by
`burn-down-mixin-driven-wide-ratchet-expansion`. The PG sequence/primary-key and
schema-qualified-name helpers reimplement name parsing and sequence lookup
instead of composing the ported helpers Rails composes.

Anchors:
`vendor/rails/activerecord/lib/active_record/connection_adapters/postgresql/schema_statements.rb`
and `.../postgresql/utils.rb` (`Utils.extract_schema_qualified_name`).

- `quoted_scope` drops `extract_schema_qualified_name`, `quote` — trails uses a
  bespoke `parseSchemaQualifiedName` on the adapter
  (`postgresql-adapter.ts#parseSchemaQualifiedName`) instead of the ported
  `Utils.extractSchemaQualifiedName` (`postgresql/utils.ts`). Same for
  `index_name`, `foreign_key_column_for`, `reference_name_for_table`,
  `remove_index`, `rename_index`.
- `pk_and_sequence_for` drops `last`, `new`, `query`, `quote`,
  `quote_table_name`; `default_sequence_name` drops `new`;
  `sequence_name_from_parts` drops `sum`.
- `reset_pk_sequence!` / `set_pk_sequence!` drop `query_value`, `quote`,
  `quote_column_name`, `quote_table_name`, `warn`. The dropped `warn` matters:
  Rails warns when the table has no primary key / no sequence, and the trails
  port is silent.
- `new_column_from_field` drops `extract_default_function`,
  `extract_value_from_default`, `match`, `presence`, `sequence_name_from_parts`.
- `exclusion_constraint_name` / `unique_constraint_name` drop `fetch`, `first`,
  `hexdigest` (and `map`) — Rails derives the generated constraint name from a
  digest; verify the trails naming matches Rails byte-for-byte, since a
  divergence here changes emitted DDL and dumped schema.

## Acceptance criteria

- Converge the name-parsing call sites onto the ported
  `Utils.extractSchemaQualifiedName` and retire the bespoke
  `parseSchemaQualifiedName` (or justify it at the call site per CLAUDE.md).
- Restore the `warn` paths in `reset_pk_sequence!` / `set_pk_sequence!`.
- Confirm generated exclusion/unique constraint names match Rails' digest
  derivation; add a regression test that fails on the current implementation if
  they do not.
- Baseline entries drop out of
  `call-mismatches-wide-exclude/activerecord/connection-adapters/postgresql-adapter.json`;
  `pnpm api:calls:wide` passes with a strictly smaller baseline.
- Tests named verbatim after the Rails tests in
  `vendor/rails/activerecord/test/cases/adapters/postgresql/`.
