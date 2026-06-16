---
title: "c1-schema-dumper-residual-gaps"
status: done
updated: 2026-06-16
rfc: "0030-ar-test-compare-residual-burndown"
cluster: null
deps: []
deps-rfc: []
est-loc: null
priority: null
pr: 3429
claim: "2026-06-16T00:28:54Z"
assignee: "c1-schema-dumper-residual-gaps"
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

4. **`schema dump allows array of decimal defaults`** — a `decimal[]` column with
   an array default introspects with a bogus base type (`"value"`), so the dump
   emits `t.column("decimal_array_default", "value", …)` instead of
   `t.decimal(…, { default: [...], array: true })`. Fix in PG decimal-array
   introspection type resolution.

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

## Acceptance criteria

Delivered in PR #3429 (the cross-adapter aliased-types gap). The remaining gaps
were each substantively deeper than the original one-line scope and are tracked
as scoped follow-up stories under this RFC (filed `draft` for triage):

- `c1-schema-dumper-mysql-gaps` — gaps 2, 3 (blob/text `size:`, index
  `type:`/`length:`, incl. the mysql branch of `schema dumps index length`).
- `c1-schema-dumper-pg-decimal-array` — gap 4.
- `c1-schema-dumper-pg-infinity-default` — gap 7 (the real PG
  default-introspection path, found via CI, is captured in that story).
- `c1-schema-dumper-timestamptz-version-compat` — gaps 5, 6.

- [x] `schema dump aliased types` un-skipped and passing on all adapters (PG-verified in CI).
- [x] No new gate-mismatches for `schema-dumper.test.ts` (test:compare: 0 for this file).
- [x] Remaining gaps re-skipped with pointer comments and tracked as the follow-up stories above.
