---
title: "Flip PG default PK to BIGSERIAL: createTable + dumper + un-skip"
status: ready
updated: 2026-06-24
rfc: "0030-ar-test-compare-residual-burndown"
cluster: null
deps:
  - pg-record-id-bigint-assertion-sweep
  - pg-record-id-bigint-sweep-batches
  - pg-record-id-bigint-sweep-habtm
  - pg-record-id-bigint-sweep-join-model
  - pg-record-id-bigint-sweep-named-scoping
  - pg-record-id-bigint-sweep-relation-with
  - pg-record-id-bigint-sweep-relations
  - pg-untyped-pk-int8-deserialization
  - pg-bigint-pk-number-fk-association-key-match
  - pg-record-id-bigint-sweep-residual-55
  - pg-bigserial-assertion-sweep-querycache-associations
  - pg-bigserial-assertion-sweep-bind-autosave-nullrel-reserved
  - pg-bigserial-assertion-sweep-tail
  - pg-bigint-assoc-key-match-through-inverse-impl
  - pg-bigserial-assertion-sweep-belongs-to
  - pg-bigserial-assertion-sweep-hasmany-hasone
  - pg-bigserial-assertion-sweep-relation-fixtures-tail
deps-rfc: []
est-loc: 60
priority: 30
pr: null
claim: null
assignee: null
blocked-by: null
---

## Context

Final structural PR of the `pg-default-pk-bigserial-cascade` campaign (RFC 0030).
Must land AFTER the two code-bug fixes (#3485 merged; untyped-PK fix) AND after
the suite-wide `record.id` BigInt assertion sweep, because the moment this lands
every default-PK column on the PG lane flips int4→int8 and every unconverged
`expect(record.id).toBe(<number>)` breaks.

The core diff (verified locally on PG 16):

- `connection-adapters/postgresql/schema-creation.ts` `typeToSql` `primary_key`
  branch → return the native string `"bigserial primary key"` directly (the PG
  adapter's `typeToSql` can't resolve it — NATIVE_DATABASE_TYPES is keyed
  camelCase `primaryKey` — and the abstract base returns int4 `SERIAL PRIMARY
KEY`). Mirrors Rails `NATIVE_DATABASE_TYPES[:primary_key] = "bigserial
primary key"`.
- `connection-adapters/postgresql/schema-dumper.ts` `isDefaultPrimaryKey` →
  narrow to `schemaType(column) === "bigserial"` only (drop the `|| "serial"`
  widening), matching Rails `schema_type(column) == :bigserial`. Update the PG
  dumper unit test `isDefaultPrimaryKey > returns ... for serial`.
- Un-skip `schema dump primary key with serial/integer` in
  `primary-keys.test.ts` (PG asserts `id: "serial"` preserved as non-default).

## Acceptance criteria

- [ ] PG default PK emits `bigserial primary key`; dumper treats only
      `bigserial` as the default; the serial/integer dump test is un-skipped and
      green.
- [ ] PG lane FULLY green (depends on the assertion sweep being complete first).
- [ ] `cc-pg-default-pk-bigserial` un-blocked and closeable.
- [ ] Green on all three lanes. Test names verbatim.

## Notes

Sequence last. Do not open until the untyped-PK fix and the record.id sweep have
merged, or the PG lane goes red across many files at once.
