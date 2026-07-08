---
title: "Abstract SchemaCreation quotedColumnsForIndex should delegate to the connection (dedup)"
status: done
updated: 2026-07-08
rfc: "0051-migration-schema-statements-fidelity"
cluster: null
deps: []
deps-rfc: []
est-loc: 40
priority: null
pr: 4764
claim: "2026-07-08T01:12:26Z"
assignee: "abstract-schema-creation-quoted-columns-for-index-delegate"
blocked-by: null
closed-reason: null
---

## Context

Rails' abstract `SchemaCreation` delegates index-column quoting to the
connection: `abstract/schema_creation.rb:18` `delegate :quoted_columns_for_index,
to: :@conn`, and `quoted_columns(o)` (line 133-134) calls it. The single source
of truth is `SchemaStatements#quoted_columns_for_index`
(abstract/schema_statements.rb:1510) -> `add_options_for_index_columns`.

trails instead has TWO independent copies:

- `abstract/schema-statements.ts:1992` `quotedColumnsForIndex` (uses
  `addOptionsForIndexColumns`; sort-order only) -- the Rails-faithful one.
- `abstract/schema-creation.ts:310` `quotedColumnsForIndex` -- a separate inline
  reimplementation (quote + sort-order + PG opclass), which
  `visitCreateIndexDefinition` calls.

Surfaced during PR #4728 (gate index sub-part length to MySQL): the fix had to
be applied to the schema-creation copy specifically, and the two copies can now
drift (e.g. PG opclass handling lives only in the schema-creation copy). This
parallels the existing `pg-schema-creation-quoted-include-columns-for-index-delegate`
story but for `quotedColumnsForIndex` on the abstract layer.

## Acceptance criteria

- [ ] Abstract `SchemaCreation#quotedColumnsForIndex` delegates to the
      connection's `SchemaStatements#quotedColumnsForIndex` (Rails
      `delegate ..., to: :@conn`) instead of reimplementing inline, keeping the
      `String === o.columns` short-circuit in `quotedColumns`.
- [ ] PG opclass decoration currently unique to the schema-creation copy is
      preserved (fold into `SchemaStatements#addOptionsForIndexColumns` / the PG
      override as Rails does via `add_index_opclass`).
- [ ] api:compare non-negative; no test:compare regression; no test-name changes.
