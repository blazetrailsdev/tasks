---
title: "migrationcontext-index-using-bookkeeping-from-capability"
status: in-progress
updated: 2026-07-05
rfc: "0023-surfaced-deviations"
cluster: null
deps: []
deps-rfc: []
est-loc: null
priority: null
pr: 4606
claim: "2026-07-05T12:37:27Z"
assignee: "migrationcontext-index-using-bookkeeping-from-capability"
blocked-by: null
closed-reason: null
---

## Context

`MigrationContext#addIndex` bookkeeping (`packages/activerecord/src/migration.ts:2337`)
gates the stored `using` on `an === "postgres"` — a MySQL index built with a
non-default access method (`USING BTREE|HASH`) DDL-persists it but never lands
in `_indexes`, so the schema dump omits it.

This is a pre-existing gap (predates PR #4604, which converged the rest of the
index bookkeeping to source from the adapter-built `IndexDefinition` gated on
the adapter `supports_*?` predicates). `using` was left on the adapter-name
check because there is no adapter-level capability predicate: `supportsIndexUsing`
lives on `SchemaCreation` (`connection-adapters/abstract/schema-creation.ts:55`),
which returns `true` for MySQL too (mysql supports `USING BTREE|HASH`), while
the abstract base and sqlite override to false.

Rails: `abstract/schema_creation.rb#visit_CreateIndexDefinition` emits
`USING #{index.using}` when `supports_index_using? && index.using`. To match
"bookkeeping mirrors what was persisted", the stored `using` should follow the
same `supports_index_using?` capability, not a Postgres-only adapter-name check.

## Acceptance criteria

- [ ] Surface `supportsIndexUsing()` as an adapter-level predicate (or otherwise
      make it readable from `MigrationContext`) mirroring Rails'
      `supports_index_using?` — true for postgres/mysql, false for sqlite.
- [ ] `MigrationContext#addIndex` stores `using` gated on that predicate (still
      dropping the `btree` default, which the dumper already omits), replacing
      the `an === "postgres"` check at migration.ts:2337.
- [ ] A MySQL index created with `using: "hash"` (or `btree` non-default context)
      round-trips through the schema dump; sqlite still drops `using`.
- [ ] No regression in migration/schema-dump round-trip tests; test names unchanged.
