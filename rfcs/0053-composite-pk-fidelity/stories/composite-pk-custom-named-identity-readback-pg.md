---
title: "Composite PK with a non-id identity column does not read DB-generated value back on PostgreSQL"
status: claimed
updated: 2026-07-06
rfc: "0053-composite-pk-fidelity"
cluster: null
deps: []
deps-rfc: []
est-loc: 90
priority: 4
pr: null
claim: "2026-07-06T18:23:54Z"
assignee: "composite-pk-custom-named-identity-readback-pg"
blocked-by: null
---

## Context

The PostgreSQL adapter auto-appends a **hardcoded** `RETURNING id` when an
INSERT has no explicit RETURNING
(`packages/activerecord/src/connection-adapters/postgresql-adapter.ts:1516-1523`):

```ts
// For INSERT without RETURNING, append RETURNING id automatically
// (only when use_insert_returning? is true — mirrors postgresql_adapter.rb:630)
if (this._useInsertReturning && upper.startsWith("INSERT") && !upper.includes("RETURNING")) {
  const withReturning = `${pgSql} RETURNING id`;
  ...
```

For a model with a **composite primary key** where one member is a DB-generated
identity/serial column whose name is **not** `id` (e.g. `[shop_id, id]` or
`[store_id, sku_id]` with a serial component), `RETURNING id` either returns the
wrong column or — if there is no literal `id` column — errors / yields nothing,
so the DB-generated identity value is never read back into the in-memory record.
`Model.find(record.id)` for the composite key then misses.

This is the **composite-key sibling** of the (single-column) story
`create-readback-custom-named-pk-postgres`, which covers a single custom-named
serial PK. The fix surface overlaps (route the RETURNING column off
`klass.primaryKey` instead of the literal `id`), but the composite case adds:
the PK is an **array**, so RETURNING must project every PK column and the
writeback must populate the identity member specifically, leaving the
caller-supplied members untouched. Rails handles this via `sql_for_insert` /
`exec_insert` returning the model's primary key(s) rather than a literal `id`.

## Acceptance criteria

- [ ] INSERT readback projects the model's actual primary-key column(s) — for a
      composite PK, every PK column — rather than a hardcoded `RETURNING id`
      (route off `klass.primaryKey`, mirroring Rails `sql_for_insert` /
      `postgresql_adapter.rb:630`).
- [ ] On `create`/`save` of a composite-PK model with a non-`id` identity
      member, the DB-generated value is written back into that member; the
      caller-supplied members are unchanged; `find` by the full composite key
      then succeeds.
- [ ] A regression test creates such a record **after the sequence has
      advanced** (so a stale value can't coincidentally match) and re-finds it.
- [ ] Coordinate with `create-readback-custom-named-pk-postgres` (single-column
      case) so the two share one `klass.primaryKey`-keyed RETURNING path rather
      than diverging; land whichever first and fold the other in.
- [ ] api:compare / test:compare delta non-negative.
