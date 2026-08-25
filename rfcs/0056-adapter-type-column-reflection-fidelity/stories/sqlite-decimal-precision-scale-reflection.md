---
title: "Reflect precision/scale for SQLite decimal(p,s)/numeric(p,s) columns"
status: done
updated: 2026-07-07
rfc: "0056-adapter-type-column-reflection-fidelity"
cluster: null
deps: []
deps-rfc: []
est-loc: 90
priority: 55
pr: 4681
claim: "2026-07-07T14:37:51Z"
assignee: "sqlite-decimal-precision-scale-reflection"
blocked-by: null
---

## Context

Surfaced by PR #3946 (sqlite-columns-converge-new-column-from-field). The new
unified `SQLite3Adapter#fetchTypeMetadata`
(`packages/activerecord/src/connection-adapters/sqlite3-adapter.ts`) parses only
a single-arg `(N)` parameter from the SQL type string (limit, or precision for
temporal types). Multi-arg types — `decimal(10,2)` / `numeric(8,2)` — do not
match `/\((\d+)\)/`, so the resulting `SqlTypeMetadata` carries
`precision: null, scale: null`. The DSL `type` still resolves to "decimal" via
`lookupCastType`'s `/decimal|numeric/i` regex registration, so this is not a
crash — but the precision/scale are dropped.

Rails surfaces `precision: 10, scale: 2` for a `decimal(10,2)` column: its sqlite
type map registers `/decimal/i` with a block that calls `extract_precision` /
`extract_scale` on the full sql_type and threads them into the cast type, which
`fetch_type_metadata` then reads (sqlite3_adapter.rb type-map init +
AbstractAdapter#fetch_type_metadata). So a schema dump of a decimal column omits
`precision:`/`scale:` in trails where Rails would emit them.

This behavior is verbatim-moved from the pre-#3946 hand-rolled `columns()`
(not a regression introduced by that PR), but #3946 made `fetchTypeMetadata`
the single shared reflection path, so it is the right place to converge.

Verified empirically in #3946: `decimal(10,2)` → `type: "decimal"`,
`precision: null`, `scale: null`.

## Acceptance criteria

- [ ] SQLite `fetchTypeMetadata` (or the `decimal`/`numeric` type-map
      registrations) surfaces `precision` and `scale` for `decimal(p,s)` /
      `numeric(p,s)` columns, matching Rails `extract_precision`/`extract_scale`.
- [ ] Schema dump of a `decimal(10,2)` column emits `precision: 10, scale: 2`.
- [ ] No regression in existing sqlite columns/schema-dump reflection.
