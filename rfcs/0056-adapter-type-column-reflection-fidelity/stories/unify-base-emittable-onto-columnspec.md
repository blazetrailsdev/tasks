---
title: "Unify base SchemaDumper.emitTable onto the columnSpec/prepareColumnOptions path"
status: ready
updated: 2026-07-07
rfc: "0056-adapter-type-column-reflection-fidelity"
cluster: null
deps: []
deps-rfc: []
est-loc: 400
priority: 67
pr: null
claim: null
assignee: null
blocked-by: null
closed-reason: null
---

## Context

`migrate-emittable-onto-columnspec-default-path` (PR #4548) routed only the two
_default-emission_ callsites of the base `SchemaDumper.emitTable`
(`packages/activerecord/src/schema-dumper.ts` — `primaryKeyTableOptions` uuid
branch and the non-`columnSpec` column loop) through the Rails-faithful
`schemaDefault` cast-type path. The rest of the base `emitTable` is still a
full parallel column-emission path: it computes `limit`/`precision`/`scale`/
type/collation inline and renders via `formatColspec` (native JS +
`JSON.stringify`), duplicating the adapter subclass's
`columnSpec`/`prepareColumnOptions` path
(`connection-adapters/abstract/schema-dumper.ts`) which renders via
`formatColspecRaw` (pre-formatted TS-DSL text).

Rails has ONE dumper: the base `SchemaDumper#table` always drives column specs
through the adapter's mixed-in `column_spec`/`prepare_column_options`. The
trails base `emitTable` is the deviation. Because default emission was split
across the two paths, PR #4548 had to add structurally-identical `schemaDefault`
/ `schemaExpression` copies on BOTH the base and the abstract subclass (flagged
as "lockstep twins" in both files) — a maintenance hazard that only fully
disappears once the base `emitTable` inline path is eliminated.

## Acceptance criteria

- The base `SchemaDumper.emitTable` inline column-emission path (limit /
  precision / scale / type / collation / default) is unified onto the
  `columnSpec` / `prepareColumnOptions` path, so there is a single
  column-spec dispatch matching Rails' single `column_spec` call site.
- The duplicated `schemaDefault` / `schemaExpression` bodies (base copy in
  `schema-dumper.ts` + `override` in `abstract/schema-dumper.ts`) collapse to a
  single definition once the base no longer needs its own copy.
- The trails-only `formatColspec` (native-JS re-serializing) formatter is
  retired in favor of `formatColspecRaw` where the two paths converge, or its
  remaining callers are documented as intentional.
- No dump-output change across PG/MySQL/SQLite and the in-memory /
  mock-source paths — verify via `schema-dumper.test.ts`,
  `schema-dumper.trails.test.ts`, dialect dumper suites, `schema-file-generator`,
  and `migration.test.ts`.
- api:compare stays green: Rails `schema_default`/`schema_expression` remain
  mapped in `connection-adapters/abstract/schema-dumper.ts`.

## Notes

- Depends conceptually on `converge-dumper-default-emission-delete-cleandefault`
  (the `cleanDefault` deletion). Larger than one 500-LOC PR is likely — split
  by concern (default already done; then limit/precision/scale; then type/
  collation; then formatter retirement) if needed.
