---
title: "MigrationContext#addIndex should source _indexes metadata from the adapter's IndexDefinition, not recompute per-adapter gating"
status: ready
updated: 2026-07-05
rfc: "0023-surfaced-deviations"
cluster: null
deps: []
deps-rfc: []
est-loc: 60
priority: null
pr: null
claim: null
assignee: null
blocked-by: null
closed-reason: null
---

## Context

PR #4568 (`migrationcontext-index-delegate-to-adapter`) converged
`MigrationContext#addIndex`/`removeIndex`
(`packages/activerecord/src/migration.ts:2262-2340`) onto the adapter's
Rails-faithful `connection.addIndex`/`removeIndex` for the DDL and the default
index-name derivation. It intentionally left one residue: the in-memory
`_indexes` bookkeeping the schema dump reads is still _recomputed_ in
`migration.ts` rather than sourced from what the adapter actually persisted.

Specifically, after delegating the DDL, `addIndex` re-derives the per-adapter
persisted-metadata gating inline (`migration.ts:2295-2311`):

- `sortOrderSupported = this.connection.supportsIndexSortOrder()` → gates
  `orders: sortOrderSupported ? options?.order : undefined`
- `usingStored = an === "postgres" && options?.using && options.using !== "btree" ? ... : undefined`
- `where: an !== "mysql" ? options?.where : undefined`
- `type` / `lengths` gated to `an === "mysql"`, `nullsNotDistinct` to
  `an === "postgres"`, plus `comment` normalization.

This is a second copy of "what the DDL actually persisted per adapter" — the
adapter already builds an authoritative `IndexDefinition`
(`SchemaStatements#addIndexOptions`, `abstract/schema-statements.ts:1883-1921`;
PG/MySQL overrides) carrying exactly these resolved fields. The reviewer
confirmed the current recomputation matches the DDL, so this is a cleanup /
deviation-reduction, not a live bug.

Goal: have `addIndex` obtain the `IndexDefinition` the adapter built (e.g. via a
`buildCreateIndexDefinition`/`addIndexOptions` seam that returns the resolved
definition) and populate `_indexes` from it, so trails carries a single copy of
the persisted-metadata gating. Mind the version-warming ordering
(`getDatabaseVersion()` before the sort-order gate is read) preserved from #4397.

## Acceptance criteria

- [ ] `MigrationContext#addIndex` records `_indexes` (columns/name/unique/where/
      orders/using/type/lengths/nullsNotDistinct/include/comment) from the
      adapter-built `IndexDefinition`, not from inline per-adapter recomputation.
- [ ] No regression in `migration.test.ts`, `migration.trails.test.ts`, or the
      schema-dump round-trip tests (SQLite/PG/MySQL lanes); test names unchanged.
- [ ] MariaDB/MySQL sort-order reconstruct parity (#4397) preserved — a
      descending canonical index still round-trips descending on a cold-leased
      connection.
