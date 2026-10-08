---
title: "pg: the PG::TextDecoder classes the adapter registers, and add_pg_decoders"
status: draft
updated: 2026-10-08
rfc: "0186-pg-gem-port"
cluster: result-and-coders
packages: ["pg", "activerecord"]
deps:
  [
    "pg-array-coders-move-to-the-package",
    "pg-result-moves-to-the-package",
    "pg-and-mysql-wire-casts-register-where-rails-configures-the-driver",
  ]
deps-rfc: []
est-loc: 450
priority: null
pr: null
claim: null
assignee: null
blocked-by: null
closed-reason: null
---

## Context

Rails configures the driver's casting in three methods:

- `add_pg_encoders` (`vendor/rails/v8.0.2/activerecord/lib/active_record/connection_adapters/postgresql_adapter.rb:1085-1091`): a `PG::TypeMapByClass` with
  `PG::TextEncoder::Integer` / `::Boolean`, assigned to `@raw_connection.type_map_for_queries`.
- `update_typemap_for_default_timezone` (`:1093-1110`): `PG::TextDecoder::TimestampUtc` or
  `TimestampWithoutTimeZone`, `@raw_connection.type_map_for_results.add_coder(...)`.
- `add_pg_decoders` (`:1112-1151`): a name → decoder-class table (`Integer`, `Float`, `Numeric`,
  `Boolean`, `TimestampUtc`, `TimestampWithTimeZone`, `Date`), `construct_coder`
  (`coder_class.new(oid:, name:)`, `:1153-1156`), a `PG::TypeMapByOid` assigned to
  `type_map_for_results`, and a second `@type_map_for_results` map holding
  `PG::TextDecoder::Bytea` and `MoneyDecoder < PG::SimpleDecoder` (`:1143-1146,1158-1164`).

trails: `_typeMapForResults = new Map<number, fn>([[17, pgUnescapeBytea]])`
(`packages/activerecord/src/connection-adapters/postgresql-adapter.ts:427`); a `getTypeParser` closure built at construction (`:570-622`);
`packages/activerecord/src/connection-adapters/postgresql/temporal-type-parsers.ts:49`, receipted onto the CLAIMED RFC 0180 story
`pg-and-mysql-wire-casts-register-where-rails-configures-the-driver`, which this story depends on
and whose result it starts from.

Gem: `TypeMapByClass` `vendor/pg/v1.5.9/ext/pg_type_map_by_class.c:264`, `[]=` `:266`; `TypeMapByOid`
`vendor/pg/v1.5.9/ext/pg_type_map_by_oid.c:378`, `add_coder` `:380`; decoders `vendor/pg/v1.5.9/ext/pg_text_decoder.c:183,990-1002`;
encoders `vendor/pg/v1.5.9/ext/pg_text_encoder.c:815,817`; `SimpleDecoder` `vendor/pg/v1.5.9/ext/pg_coder.c:600`;
`TimestampUtc` etc. Ruby `vendor/pg/v1.5.9/lib/pg/text_decoder/timestamp.rb:7-28`; `Date`
`vendor/pg/v1.5.9/lib/pg/text_decoder/date.rb:11`; `Coder#oid` `vendor/pg/v1.5.9/ext/pg_coder.c:570`;
`type_map_for_queries=` `vendor/pg/v1.5.9/ext/pg_connection.c:4669`, `type_map_for_results=` / reader `:4671-4672`.

The maps and encoders land in `pg-type-maps-and-text-encoders-move-to-the-package`; this story is
the decoders and the two adapter methods that register them.

## Acceptance criteria

- [ ] The package has `PG.SimpleDecoder` and `PG.TextDecoder.Integer` / `.Float` / `.Numeric` / `.Boolean` / `.Bytea` / `.Timestamp` / `.TimestampUtc` / `.TimestampWithoutTimeZone` / `.TimestampWithTimeZone` / `.Date`, each with `decode(string, tuple = nil, field = nil)`.
- [ ] `updateTypemapForDefaultTimezone`, `addPgDecoders` and `constructCoder` are `postgresql_adapter.rb:1093-1156` line for line; `MoneyDecoder extends PG.SimpleDecoder` (`:1158-1164`).
- [ ] The `getTypeParser` closure at `postgresql-adapter.ts:570-622`, the adapter-local decoder subclasses the previous story left, and the `OID_BYTEA` passthrough in the package engine are gone or reduced to what node-pg needs to hand back raw text.
- [ ] Each decoder returns what the gem's returns for the values Rails' own tests exercise. Where the JS value type differs from Ruby's (Float and Integer both `number`, `BigDecimal`, `Time`) the story names the trails type already used at that site today and keeps it; it does not introduce a new value type.
- [ ] `pnpm parity:api:calls` green for the three methods; converged rows deleted by hand.

## Verification

```bash
pnpm vitest run packages/pg packages/activerecord/src/connection-adapters/postgresql && pnpm parity:api:calls
```
