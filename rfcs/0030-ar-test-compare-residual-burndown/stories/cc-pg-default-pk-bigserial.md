---
title: "cc-pg-default-pk-bigserial"
status: blocked
updated: 2026-07-05
rfc: "0030-ar-test-compare-residual-burndown"
cluster: null
deps:
  - pg-default-pk-bigserial-cascade
deps-rfc: []
est-loc: null
priority: 3
pr: null
claim: "2026-06-16T02:20:53Z"
assignee: "cc-pg-default-pk-bigserial"
blocked-by: "Blocked on pg-default-pk-bigserial-cascade: the createTable→BIGSERIAL + dumper-narrowing change is correct but cascades BigInt ids across the PG lane, surfacing genuine code bugs (IN-clause BigInt coercion, int8-on-untyped-attr raw-string deserialize). Cannot land green in one 300-LOC PR; escalated to the cascade campaign story which sequences the code-bug fixes before the createTable change."
---

## Context

Surfaced while un-skipping `primary_keys_test.rb` schema-dump residuals in RFC
0030 story `cc-schema-dumper-pk-rendering`. Rails' PostgreSQL default primary
key is `BIGSERIAL` (`PostgreSQLAdapter::NATIVE_DATABASE_TYPES[:primary_key] =
"bigserial primary key"`). TS declares the same in
`postgresql-adapter.ts` (`NATIVE_DATABASE_TYPES.primaryKey = "bigserial primary
key"`), but `connection-adapters/postgresql/schema-creation.ts` intercepts the
`primary_key` type and delegates to the abstract `typeToSql`, which returns
`"SERIAL PRIMARY KEY"` (int4). So TS PG `createTable` emits a 32-bit SERIAL
default PK where Rails emits a 64-bit BIGSERIAL.

Consequence for the schema dumper: an explicit `id: :serial` PK is byte-identical
to the default PK in the database, so the dumper cannot distinguish them. The PG
`SchemaDumper.isDefaultPrimaryKey` is deliberately widened to treat both
`serial` and `bigserial` as "default" (suppressing the `id:` option) so default
tables round-trip. This blocks the Rails test `schema dump primary key with
serial/integer` (PG lane: `@pk_type = :serial`, asserts `id: :serial`), which
stays skipped in `packages/activerecord/src/primary-keys.test.ts`.

## Acceptance criteria

- [ ] PG `createTable` with a default primary key emits BIGSERIAL (bigint),
      matching Rails `NATIVE_DATABASE_TYPES[:primary_key]`.
- [ ] PG `SchemaDumper.isDefaultPrimaryKey` narrowed to `bigserial` only
      (matching Rails `schema_type(column) == :bigserial`); default-PK tables
      still dump with no `id:` option, explicit `id: :serial` dumps as
      `id: "serial"`.
- [ ] Un-skip `schema dump primary key with serial/integer` in
      `primary-keys.test.ts` and confirm it passes on the PG lane.
- [ ] Audit the suite for fixtures/tests that assume an int4 default PK on PG
      and converge them.
