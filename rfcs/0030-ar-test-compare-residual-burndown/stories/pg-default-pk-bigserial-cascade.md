---
title: "PG default PK → BIGSERIAL cascade (BigInt-id convergence campaign)"
status: ready
updated: 2026-06-16
rfc: "0030-ar-test-compare-residual-burndown"
cluster: null
deps: []
deps-rfc: []
est-loc: null
priority: 1
pr: null
claim: null
assignee: null
blocked-by: null
---

## Context

Spun out of RFC 0030 story `cc-pg-default-pk-bigserial`, which proved too large
to land in one PR. Rails' PostgreSQL default primary key is `BIGSERIAL`
(`NATIVE_DATABASE_TYPES[:primary_key] = "bigserial primary key"`), but TS PG
`createTable` emits `SERIAL` (int4): `connection-adapters/postgresql/schema-creation.ts`
intercepts the `primary_key` type and routes to the abstract `typeToSql`, which
returns `"SERIAL PRIMARY KEY"`. (Note: the PG adapter's own `typeToSql` can't
resolve `primary_key` either — `NATIVE_DATABASE_TYPES` is keyed camelCase
`primaryKey`, so `nativeDatabaseTypes()["primary_key"]` is `undefined` and yields
the literal `"primary_key"`. The fix must emit the native string directly.)

The minimal core change (verified locally on the PG lane):

- `schema-creation.ts` `typeToSql` `primary_key` branch → return
  `"bigserial primary key"`.
- `postgresql/schema-dumper.ts` `isDefaultPrimaryKey` → narrow to
  `schemaType(column) === "bigserial"` only (drop the `|| "serial"` widening),
  matching Rails `schema_type(column) == :bigserial`. Update the PG dumper unit
  test `isDefaultPrimaryKey > returns ... for serial` accordingly.
- Un-skip `schema dump primary key with serial/integer` in `primary-keys.test.ts`
  (PG lane asserts `id: "serial"` is preserved as non-default).

### Why this can't be one PR

Making the default PK 64-bit flips every default-PK column on the PG lane from
int4 → int8. trails deserializes `bigint` columns to JS `BigInt` (see
`activemodel/src/type/big-integer.ts` `BigIntegerType.castValue`), so `record.id`
becomes `1n` instead of `1` across the suite. This cascades into genuine code
bugs, not just assertion churn:

- **finder.test.ts**: `find on hash conditions with array of integers and ranges`
  and `find with multiple IDs` throw `"Cannot convert a BigInt value to a number"`
  — an IN-clause / id-range path that does arithmetic on ids and can't handle
  `BigInt`.
- **persistence.test.ts**: `update columns changing id` reads back the raw string
  `"999"` (not `999n`) — a latent bug: an ad-hoc model class that declares some
  attributes but not `id` has no registered type for the PK, so node-postgres'
  int8-as-string default passes through _uncast_. (int4 is parsed to `number` by
  the driver, which is why this was previously masked.)
- Many `expect(record.id).toBe(<number>)` assertions in Rails-mirrored tests will
  need converging to `BigInt`.

A reliable full-suite blast-radius count could not be obtained locally: a cold
isolated DB lacks the canonical-schema priming CI does, so the baseline (no
change) already fails 404 files / 93 tests and runs a different test count, making
the numbers non-comparable. The warm targeted spot-checks above are the trustworthy
signal: the breakage is real, spread, and includes code bugs requiring real fixes.

## Acceptance criteria

Land as a sequenced set of small PRs (each <300 LOC, each PR green on all three
lanes), NOT one PR:

- [ ] Fix the IN-clause / id-range query path to accept `BigInt` ids without
      `Number()` coercion (the `"Cannot convert a BigInt value to a number"` bug).
- [ ] Fix int8-on-untyped-attribute deserialization so a PK column with no
      explicitly declared attribute type still casts the driver's string to
      `BigInt` (the `"999"` raw-string bug), or otherwise mirror Rails.
- [ ] Land the core createTable + dumper change (above) and un-skip
      `schema dump primary key with serial/integer`.
- [ ] Sweep the PG lane and converge `record.id` assertions to `BigInt` across the
      suite (likely several PRs, grouped by test file). Test names stay verbatim.
- [ ] PG lane fully green; `cc-pg-default-pk-bigserial` un-blocked and closed.

## Notes

The core diff is captured above so it does not need re-derivation. Sequence the
two code-bug fixes BEFORE the createTable change so the cascade lands on a suite
that can already tolerate BigInt ids.
