---
title: "pg-column-type-declared-nullable-honest"
status: ready
updated: 2026-07-09
rfc: "0056-adapter-type-column-reflection-fidelity"
cluster: null
deps: []
deps-rfc: []
est-loc: 40
priority: 211
pr: null
claim: null
assignee: null
blocked-by: null
closed-reason: null
---

## Context

PR #4801 made `Column#type` nil-faithful for an unmapped `sql_type`. For PG,
`postgresql/column.ts:74` keeps an override that returns `super.type as string`:
the runtime value is genuinely `null` (composite/unmapped OID, matching Rails'
`delegate :type, allow_nil: true`, column.rb:12) but the DECLARED return type is
`string`. The `as string` cast suppresses the type error rather than telling the
truth — a future caller typed against `PostgreSQL.Column` could do
`.type.toLowerCase()` with no null-guard and the compiler wouldn't catch it.

The honest fix is to declare `get type(): string | null`. PR #4801 did not do
this because it reintroduces a ~13-error cascade in `postgresql/schema-dumper.ts`:
the PG dumper's method overrides are annotated with the raw `PostgreSQL.Column`
class, and the base dumper's `Column`/`ColumnInfo.type` (schema-dumper.ts:37) is
`string` (the coalesced, never-nil dump shape from `SchemaSource.columns()` at
schema-dumper.ts:244). Widening PG `Column.type` breaks that structural match.

Current callers are all safe today (verified in review): `postgresql/schema-dumper.ts`,
`quoting.ts:191`, `schema-statements-class.ts:1024` all guard with `??`/equality.

## Acceptance criteria

- [ ] `postgresql/column.ts` `get type()` declares `string | null` (drop the
      `as string` cast), matching `BaseColumn#type` and Rails `allow_nil: true`.
- [ ] Resolve the resulting `postgresql/schema-dumper.ts` cascade honestly:
      decouple the PG dumper's method param types from the raw `Column` class
      (use the base dumper's coalesced `ColumnInfo` shape), or widen the dumper's
      `type` plumbing to `string | null` and coalesce in `schemaType`. Do NOT
      reintroduce a `?? ""` mask.
- [ ] No behavior change to schema dumps (the coalesced ColumnInfo is still
      never-nil at runtime); reflection `col.type` stays nil for unmapped.
- [ ] test:compare non-negative.
