---
title: "c1-schema-dumper-residual-gaps"
status: in-progress
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
   `blob`/`numeric` aliases. ~~RESOLVED on `main`~~ — `t.blob`/`t.numeric` now
   round-trip to `t.binary`/`t.decimal`; the test passes. No longer a gap.

2. ~~**`schema dump includes length for mysql blob and text fields`**~~ —
   RESOLVED on `main`: the `size:` option on `t.binary`/`t.text` is now honored
   on the creation path and round-trips, so the test passes on mysql. No longer
   a gap.

3. ~~**`schema dumps index type`** (mysql `type: :fulltext`) and the mysql
   branch of **`schema dumps index length`** (`length: 10`)~~ — RESOLVED on
   `main`: index `type:` and sub-part `length:` are now honored and surfaced by
   mysql `indexes()` introspection; both tests pass. No longer a gap.

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
