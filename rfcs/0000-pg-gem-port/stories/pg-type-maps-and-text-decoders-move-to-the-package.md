---
title: "pg: TypeMapByOid, TypeMapByClass and the text coders the adapter registers"
status: draft
updated: 2026-10-08
rfc: "0000-pg-gem-port"
cluster: result-and-coders
packages: ["pg", "activerecord"]
deps:
  [
    "pg-array-coders-move-to-the-package",
    "pg-result-moves-to-the-package",
    "pg-and-mysql-wire-casts-register-where-rails-configures-the-driver",
  ]
deps-rfc: []
est-loc: 650
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

## Acceptance criteria

- [ ] The package has `PG.TypeMapByClass` (`set`, the `[]=` port), `PG.TypeMapByOid` (`addCoder`), `PG.SimpleDecoder`, `PG.TextEncoder.Integer` / `.Boolean`, `PG.TextDecoder.Integer` / `.Float` / `.Numeric` / `.Boolean` / `.Bytea` / `.Timestamp` / `.TimestampUtc` / `.TimestampWithoutTimeZone` / `.TimestampWithTimeZone` / `.Date`, and `Coder#oid`.
- [ ] `PG.Connection` has `typeMapForQueries=` (as `setTypeMapForQueries`, per the `x=` convention only if it must be awaited; a plain setter otherwise), `typeMapForResults` and its setter. The engine applies the result map through node-pg's per-query `types` and the query map to binds.
- [ ] `addPgEncoders`, `updateTypemapForDefaultTimezone`, `addPgDecoders` and `constructCoder` are line-for-line the Rails methods; `MoneyDecoder extends PG.SimpleDecoder`.
- [ ] `PG.Result#mapTypesBang` takes a `PG.TypeMapByOid`; the receipt left by `pg-result-moves-to-the-package` is removed.
- [ ] The `getTypeParser` closure at `postgresql-adapter.ts:570-622` and the `OID_BYTEA` passthrough in the package engine are both gone or reduced to what node-pg needs to hand back raw text.
- [ ] Each decoder returns what the gem's returns for the values Rails' own tests exercise; where a JS value type differs from Ruby's (Float vs Number, `Time` vs trails' time type) the story names the trails type and cites the existing decision, it does not invent one.
- [ ] If this exceeds the PR ceiling, ship the type maps and encoders and file the decoders as a new story with `pnpm tasks new`.

## Verification

```bash
pnpm vitest run packages/pg packages/activerecord/src/connection-adapters/postgresql && pnpm parity:api:calls
```

## Notes

The dependency on the claimed 0180 story is deliberate: two stories rewriting the same closure
in parallel conflict. If that story is closed without landing, drop the dep with `tasks set-deps`.
