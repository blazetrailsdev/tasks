---
title: "cc-schema-dumper-pk-rendering"
status: claimed
updated: 2026-06-16
rfc: "0030-ar-test-compare-residual-burndown"
cluster: null
deps: []
deps-rfc: []
est-loc: null
priority: null
pr: null
claim: "2026-06-16T01:56:53Z"
assignee: "cc-schema-dumper-pk-rendering"
blocked-by: null
---

## Context

Surfaced while un-skipping `primary_keys_test.rb` residuals in RFC 0030 story
`c3-primary-keys` (`packages/activerecord/src/primary-keys.test.ts`). The TS
schema dumper (`packages/activerecord/src/schema-dumper.ts` `emitTable` /
`primaryKeyTableOptions`) does not render primary keys faithfully to Rails in
several cases, leaving four `primary_keys_test.rb` schema-dump tests skipped:

1. **Single custom-named PK** (`schema dump primary key includes type and
options`): a non-`id` single PK (e.g. `barcodes` with `primary_key: "code",
id: :string, limit: 42`) is rendered as `id: false` + a plain
   `t.string("code", { limit: 42 })` column. Rails renders
   `primary_key: "code", id: { type: :string, limit: 42 }`. There is no
   `column_spec_for_primary_key` equivalent for single custom keys —
   `primaryKeyTableOptions` only handles `uuid`.

2. **Composite PK column order** (`dumping composite primary key out of
order`): `barcodes_reverse` declares columns `(region, code)` but its PK is
   `(code, region)`. The dumper emits `primaryKey: ["region","code"]` (table
   declaration order) where Rails emits `["code", "region"]` (PK definition
   order). The adapter's `primaryKeys()` already returns the correct order
   (the non-dump test "composite primary key out of order" passes); only the
   dumper introspection path is wrong.

3. **integer/bigint id with `default: nil`** (`schema dump primary key integer
with default nil`, `schema dump primary key bigint with default nil`): the
   MySQL dumper drops the PK `default` entirely; the SQLite dumper drops the
   bigint id + default entirely (emits just `force: "cascade"`). Rails asserts
   `id: :integer, default: nil` / `id: :bigint, default: nil`.

4. **PG serial id** (`schema dump primary key with serial/integer`): for a
   `:serial` PK the dumper emits no `id:` option at all (treats serial as the
   default), where Rails emits `id: :serial`.

Verified outputs (sqlite/pg/mysql) recorded against
`SchemaDumper.dumpTableSchema` during the c3-primary-keys investigation.

## Acceptance criteria

- [ ] Schema dumper renders a single custom-named primary key as
      `primaryKey: "<name>"` plus its `id: { type, ... }` options (mirror
      Rails `column_spec_for_primary_key`).
- [ ] Composite PK columns are emitted in PK definition order, not table
      declaration order.
- [ ] integer/bigint primary keys preserve an explicit `default: null` across
      sqlite/pg/mysql dumps.
- [ ] PG `:serial` primary key emits the `id: :serial` (TS DSL equivalent)
      shorthand.
- [ ] Un-skip the four schema-dump tests in `primary-keys.test.ts`
      (`schema dump primary key includes type and options`,
      `dumping composite primary key out of order`,
      `schema dump primary key integer with default nil`,
      `schema dump primary key bigint with default nil`,
      `schema dump primary key with serial/integer`) and confirm they pass on
      the adapters Rails gates them to.
