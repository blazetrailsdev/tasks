---
title: "MigrationContext#addIndex/removeIndex should delegate DDL to the adapter (drop duplicated name derivation)"
status: ready
updated: 2026-07-01
rfc: "0023-surfaced-deviations"
cluster: null
deps: []
deps-rfc: []
est-loc: 120
priority: null
pr: null
claim: null
assignee: null
blocked-by: null
closed-reason: null
---

## Context

`MigrationContext#addIndex`/`removeIndex`
(`packages/activerecord/src/migration.ts:2398-2549`) hand-roll their own
`CREATE INDEX`/`DROP INDEX` SQL and default index-name derivation
(`index_${bareTable}_on_${nameParts}`) instead of delegating to the
connection adapter's Rails-faithful `addIndex`/`removeIndex`
(`postgresql-adapter.ts`, `abstract/schema-statements.ts`). Rails' `Migration`
funnels everything through `connection.add_index` /
`add_index_options` → `index_name` → `generate_index_name`
(abstract/schema_statements.rb:1482, ~576), so the bespoke path diverges:

- No `generate_index_name` length/hash fallback: a long table+column combo
  produces an over-length raw `index_..._on_...` name in `MigrationContext`
  where the adapter (and Rails) would emit the hashed `idx_on_...<hash>` form.
- The bespoke path builds the name against the un-`_pt`'d table it issues DDL
  on, so name-vs-DDL can drift if it were ever routed through `this.indexName`
  (which applies `_pt`). trails carries two name-derivation copies.

The `fix-schema-qualified-index-name-derivation` PR (#4386) converged the
schema-qualified split (shared `_splitSchemaQualified` → adapter's quote-aware
`extractSchemaQualifiedName`) and the `options.name` schema handling, but left
the broader duplication in place as out-of-scope.

## Acceptance criteria

- [ ] `MigrationContext#addIndex`/`removeIndex` delegate the DDL + default-name
      derivation to the connection adapter (`this.connection.addIndex` /
      `removeIndex`), keeping only the `_indexes` in-memory bookkeeping needed
      for schema dumps — mirroring Rails' `Migration` delegating to
      `connection.add_index`.
- [ ] Long index names get the `generate_index_name` hash fallback via the
      adapter (parity with direct `connection.add_index`).
- [ ] No regression in `migration.test.ts` (SQLite/PG/MySQL lanes) or the
      schema-dump round-trip tests; test names unchanged.
