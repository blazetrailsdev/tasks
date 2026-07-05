---
title: "Converge MySQL Column.primaryKey flag off column_key (promoted-unique deviation)"
status: claimed
updated: 2026-07-05
rfc: "0048-one-schema-no-drop-tests"
cluster: null
deps: []
deps-rfc: []
est-loc: null
priority: 5
pr: null
claim: "2026-07-05T03:37:28Z"
assignee: "converge-mysql-column-primarykey-flag-promoted-unique"
blocked-by: null
---

## Context

Follow-up to PR #4379 (fix-mysql-unique-notnull-index-pk-reflection-and-add-string-key-objects-index).
That PR fixed the observable dumper bug (MySQL/MariaDB promoted-unique index → `id: false`)
at the dumper layer (`mysql/schema-dumper.ts` `resolvePrimaryKeyColumns` reads the authoritative
`primaryKeyOrderCache`), but left the underlying reflection deviation live:

`mysql/schema-statements.ts:633` still sets `Column.primaryKey = colKey === "PRI"`. MySQL/MariaDB
report `column_key = 'PRI'` for a UNIQUE NOT NULL index when the table has no PRIMARY KEY (the
"promoted unique" case). Rails' `MySQL::Column` carries **no** per-column primary flag at all
(`abstract_mysql_adapter.rb`), resolving PK only via `@connection.primary_key`
(key_column_usage / constraint 'PRIMARY').

trails' `Column.primaryKey` flag is consumed by:

- `schema-cache.ts:323` `getCachedPrimaryKeys()` — column-flag fallback (third tier, behind the
  authoritative `_primaryKeys` cache at :316 and explicit model `_primaryKey`).
- `attribute-methods/primary-key.ts:187` `getPrimaryKeyAttr()` — via getCachedPrimaryKeys.
- `schema-introspection.ts:141` `introspectPrimaryKey()` — fallback when `adapter.primaryKey()` absent.

Currently **shielded** from any observable bug because (a) every promoted-unique table in the
canonical schema declares an explicit model primary_key (string_key_objects→id, subscribers→nick),
and (b) `add()` warms `_primaryKeys` before `_columns`, so the authoritative cache wins over the
column-flag fallback. But it is a latent fidelity deviation.

**Why not fixed at source in PR #4379** (proven by CI + local repro, do not retry naively):

1. Adding a SEPARATE pk query inside `columns()` trips `QueryCacheTest > query cached even when
types are reset` (counts introspection queries; resetColumnInformation clears the sync path).
2. Folding a JOIN (key_column_usage OR statistics) into the `columns()` SELECT disrupts MariaDB's
   single-table pruning of `information_schema.columns` → each of ~100 per-table `columns()` calls
   in a full-DB dump scans all tables' metadata → `SchemaDumperTest` exceeds the 5s test timeout
   (origin baseline ~3s). A correlated subquery is worse (per-column rescan → 30s+ defineSchema warm).

## Acceptance criteria

- [ ] Converge `Column.primaryKey` on MySQL/MariaDB so a promoted-unique index is NOT flagged as
      primary key — WITHOUT regressing QueryCacheTest or timing out the full-DB SchemaDumperTest.
      Likely requires a query-free correction (derive from the already-warm authoritative
      `_primaryKeys` cache) or restructuring so columns() need not carry the flag on MySQL.
- [ ] `getCachedPrimaryKeys` column-flag fallback + `introspectPrimaryKey` fallback return the
      correct (promoted-unique-excluding) answer for MySQL.
- [ ] No new per-table query on the dump path; QueryCacheTest green; api:compare / test:compare
      non-negative.
