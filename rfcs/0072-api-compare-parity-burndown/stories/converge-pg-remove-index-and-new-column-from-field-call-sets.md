---
title: "converge-pg-remove-index-and-new-column-from-field-call-sets"
status: in-progress
updated: 2026-07-27
rfc: "0072-api-compare-parity-burndown"
cluster: null
deps: []
deps-rfc: []
est-loc: null
priority: null
pr: 5409
claim: "2026-07-27T14:29:08Z"
assignee: "converge-pg-remove-index-and-new-column-from-field-call-sets"
blocked-by: null
closed-reason: null
---

## Context

Remainder of the `converge-pg-sequence-and-schema-qualified-name-helpers`
cluster (RFC 0072). That PR converged the schema-qualified-name call sites onto
the ported `Utils.extractSchemaQualifiedName` (retiring the bespoke
`parseSchemaQualifiedName`), restored the `@logger.warn` paths in
`set_pk_sequence!` / `reset_pk_sequence!`, converged those two onto
`query_value` / `quote` / `quote_table_name` / `quote_column_name`, converged
`pk_and_sequence_for`'s table predicate onto `quote(quote_table_name(...))`, and
converged `rename_index` onto `execute` / `quote_table_name` /
`quote_column_name`. 22 wide-ratchet entries dropped.

These entries still flag in
`scripts/api-compare/call-mismatches-wide-exclude/activerecord/connection-adapters/postgresql-adapter.json`:

- `remove_index` drops `execute`, `index_algorithm`, `index_exists?`,
  `index_name_for_remove`, `quote_table_name`. Rails
  (`postgresql/schema_statements.rb#remove_index`, ~line 543) builds a
  `PostgreSQL::Name` for the index and emits
  `DROP INDEX #{index_algorithm(...)} #{quote_table_name(index_to_remove)}`;
  trails (`postgresql-adapter.ts#removeIndex`) reimplements the whole body.
- `new_column_from_field` drops `extract_default_function`,
  `extract_value_from_default`, `match`, `presence`, `sequence_name_from_parts`
  (`schema_statements.rb:966`). The serial detection currently routes through
  the bespoke `serialFromDefaultFunction` on the adapter rather than composing
  `sequence_name_from_parts` inline the way Rails does.
- `pk_and_sequence_for` drops `last`, `new`, `query`. Rails runs two queries
  (pg_depend, then a pg_attrdef fallback) and returns
  `[pk, PostgreSQL::Name.new(*result)]`; trails runs one rewritten pg_index
  query and returns a plain `{ schema, name }` object. Converging the return
  type to `Name` ripples into `set_pk_sequence!` / `reset_pk_sequence!` /
  `rename_table`, which is why it was deferred.
- `exclusion_constraint_name` / `unique_constraint_name` drop `fetch`, `first`,
  `hexdigest`, `map`, and `sequence_name_from_parts` drops `sum`. These are
  bucket-(b) syntax-only: JS has no `Hash#fetch`, `Enumerable#first(n)`,
  `Digest::SHA256.hexdigest` or `Array#sum`. The digest derivation is already
  byte-identical to Rails — `schema-statements-class.trails.test.ts` pins
  `excl_rails_74c9160f55`, `uniq_rails_1e07660b77`, `uniq_rails_79b901ffb4`
  against Rails' own literals. These entries should get an explicit bucket-(b)
  `reason` rather than the generic RFC 0047 seed text, not a code change.

## Acceptance criteria

- Converge `remove_index` onto Rails' body (`index_algorithm`,
  `index_name_for_remove`, `quote_table_name`, `execute`, `index_exists?`).
- Converge `new_column_from_field` onto `extract_value_from_default` /
  `extract_default_function` / `sequence_name_from_parts`.
- Either converge `pk_and_sequence_for` onto Rails' two-query shape returning
  `PostgreSQL::Name`, or justify the deviation at the call site.
- Rewrite the `reason` on the remaining bucket-(b) entries
  (`fetch` / `first` / `hexdigest` / `map` / `sum`) to state the Ruby-idiom
  reason instead of the generic RFC 0047 seed text.
- `pnpm api:calls:wide` passes with a strictly smaller baseline.
- Tests named verbatim after the Rails tests in
  `vendor/rails/activerecord/test/cases/adapters/postgresql/`.
