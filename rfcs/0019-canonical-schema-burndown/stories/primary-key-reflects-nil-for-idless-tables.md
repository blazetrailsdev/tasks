---
title: "primary-key-reflects-nil-for-idless-tables"
status: claimed
updated: 2026-06-21
rfc: "0019-canonical-schema-burndown"
cluster: null
deps: []
deps-rfc: []
est-loc: null
priority: null
pr: null
claim: "2026-06-21T22:22:42Z"
assignee: "primary-key-reflects-nil-for-idless-tables"
blocked-by: null
---

## Context

Follow-up from PR #3835 (story `persistence-non-pk-autoincrement-writeback`).
That PR's `_returningColumnsForInsert`
(`packages/activerecord/src/model-schema.ts:517`) falls back to
`Array(primary_key)` when no auto-populated columns are reported. Rails'
`_returning_columns_for_insert` (vendor/rails/.../model_schema.rb:436-443)
leaves `Array(primary_key)` UNFILTERED — it yields `[]` for an id-less table
only because Rails' schema reflection returns `nil` for `primary_key` there.

trails diverges: `Base.primaryKey` defaults to `"id"` for a model on an
id-less table (e.g. an HABTM join table) instead of reflecting `nil`. PR #3835
compensated downstream by filtering the PK fallback to columns that actually
exist (`pkArr.filter(p => colNames.has(p))`) so it stops emitting an explicit
`RETURNING "id"` that PostgreSQL rejects (42703). That filter is a workaround,
not the faithful fix.

## Acceptance criteria

- [ ] `Base.primaryKey` (model-schema.ts) reflects `null` for a model whose
      table has no matching PK column (mirrors Rails schema reflection returning
      nil), so `_returningColumnsForInsert`'s `Array(primary_key)` fallback is
      naturally empty for id-less tables.
- [ ] Once the reflection is faithful, drop the per-call `colNames.has(p)`
      existence filter added in PR #3835 (model-schema.ts) and the
      `_returningColumnsForInsert` body matches model_schema.rb:436-443 verbatim.
- [ ] No regression on the id-less HABTM join-table insert path
      (`join-model.test.ts` "add to join table with no id",
      `inverse-associations.test.ts` "...automatic inverse shares objects") on
      sqlite/postgres/mysql lanes.
- [ ] `pnpm lint` + typecheck clean.
