---
title: "c1-schema-dumper-residual-gaps"
status: ready
updated: 2026-06-16
rfc: "0030-ar-test-compare-residual-burndown"
cluster: null
deps: []
deps-rfc: []
est-loc: null
priority: null
pr: null
claim: null
assignee: null
blocked-by: null
---

## Context

Spun off from `c1-schema-dumper-parity` (RFC 0030). That story un-skipped the
schema_dumper tests whose behavior the dumper already supports. The following
tests in `packages/activerecord/src/schema-dumper.test.ts` remain `it.skip`
(tags point here) because they need features beyond schema_dumper column-spec
parity. Each is a distinct, separable gap.

Rails source: `vendor/rails/activerecord/test/cases/schema_dumper_test.rb`.

### Gaps

1. **`schema dump aliased types`** — abstract `TableDefinition` has no
   `blob`/`numeric` aliases (Rails registers them as aliases of binary/decimal).
   `blob` exists only on the mysql definition; `numeric` is unregistered.
   Fix in `connection-adapters/abstract/schema-definitions.ts` + type-alias
   registration so `t.blob`/`t.numeric` round-trip to `t.binary`/`t.decimal`.

2. **`schema dump includes length for mysql blob and text fields`** — the
   `size:` option on `t.binary`/`t.text` is dropped on the _creation_ path, so
   `t.binary "x", size: :tiny` creates a plain BLOB and the dump omits the size.
   `t.tinyblob`/`t.tinytext` round-trip fine; the `size:`-option form does not.
   Fix in mysql schema-statements size: → DDL type mapping.

3. **`schema dumps index type`** (mysql `type: :fulltext`) and the mysql branch
   of **`schema dumps index length`** (`length: 10`) — index `type:` and
   sub-part `length:` are neither honored on the addIndex creation path nor
   surfaced by mysql `indexes()` introspection, so `SchemaDumper#indexParts`
   never emits them. Fix in mysql adapter index introspection + addIndex.

4. ~~**`schema dump allows array of decimal defaults`**~~ — RESOLVED on `main`
   (the decimal-array introspection was converged independently; the test now
   passes against PG). No longer a gap.

5. **timestamptz / datetime_type family** (`schema dump with timestamptz
datetime format`, `schema dump when changing datetime type for an existing
app`, `schema dump with correct timestamp types via create table and t
timestamptz`) — needs a `t.timestamptz` `TableDefinition` helper and a
   datetime_type-aware dumper that rewrites timestamp/timestamptz columns based
   on `PostgreSQLAdapter.datetimeType`.

6. **migration-version-compat family** (`timestamps schema dump before rails 7`,
   `… before rails 7 with timestamptz setting`, `schema dump with correct
timestamp types via add column before rails 7`, `… before rails 7 with
timestamptz setting`) — needs `Migration[6.1]` version compatibility, which
   changes how datetime/timestamp columns are emitted.

7. **`schema dump with column infinity default`** — `cleanDefault` does not
   translate PG `'Infinity'`/`'-Infinity'`/`'NaN'` string defaults into JS
   `Infinity`/`-Infinity`/`NaN` literals, so float/datetime/date columns with
   infinity defaults do not round-trip. Fix in `schema-dumper.ts` `cleanDefault`.

8. **PG oid introspection surfaces a bogus `limit: 8`** — Rails' oid column
   reports `limit == nil` (`NATIVE_DATABASE_TYPES[:oid]` carries no `:limit`,
   postgresql_adapter.rb:177); trails PG introspection surfaces limit 8. The
   `c1-schema-dumper-parity` PR works around this with a `schemaType === "oid"`
   guard in `schema_limit` (abstract/schema-dumper.ts) so `t.oid` dumps bare,
   but the root-cause fix is in PG column introspection (oid should not carry a
   limit), or a general `native_database_types` limit comparison in
   `schema_limit` (mirroring the existing `isSerial` special-case). Until then,
   any oid-typed path that does not route through that dumper guard still sees
   the spurious limit.

## Acceptance criteria

- [ ] Each listed `it.skip` in `schema-dumper.test.ts` is un-skipped and passes
      against the adapter its Rails `current_adapter?` gate targets.
- [ ] The mysql branch of `schema dumps index length` is restored (currently
      `skipIf(adapterType === "mysql")`).
- [ ] No new gate-mismatches for `schema-dumper.test.ts`.
