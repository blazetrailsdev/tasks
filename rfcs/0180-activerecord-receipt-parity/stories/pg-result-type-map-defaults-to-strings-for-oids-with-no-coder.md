---
title: "activerecord: PG result type map answers a String for an OID with no coder"
status: draft
updated: 2026-10-08
rfc: "0180-activerecord-receipt-parity"
cluster: null
packages: []
deps: []
deps-rfc: []
est-loc: 300
priority: null
pr: null
claim: null
assignee: null
blocked-by: null
closed-reason: null
---

## Context

Left over from `pg-and-mysql-wire-casts-register-where-rails-configures-the-driver`, which moved the PostgreSQL result decoders into `PostgreSQLAdapter#addPgDecoders` and `PGConnection#typeMapForResults`.

ruby-pg's `PG::TypeMapByOid` answers a String for every OID with no coder, so `add_pg_decoders` (`vendor/rails/v8.0.2/activerecord/lib/active_record/connection_adapters/postgresql_adapter.rb:1112-1151`) is the whole list of decoded types. node-pg decodes many more by default (arrays, json, interval, point, circle, date, timestamps), and trails suppresses a hand-picked subset:

- `packages/activerecord/src/connection-adapters/postgresql-adapter.ts` `STRING_OIDS` / `pgTypeParser` is a fixed OID list handed to `pg.Client` as `types.getTypeParser`. Every other OID still takes node-pg's default parser, so `int4[]`, `text[]` and friends reach the type layer as JS arrays where Rails hands `OID::Array` a String.
- `packages/activerecord/src/connection-adapters/postgresql/pg-connection.ts` `types()` falls back to `client.getTypeParser` for an OID with no coder, and special-cases bytea.
- `addPgDecoders` omits `@type_map_for_results.default_type_map = map` (`postgresql_adapter.rb:1143`), because the connection map has already decoded the value.
- Queries sent with `client.query` directly (`SHOW server_version_num`, `postgresql-adapter.ts`) bypass `typeMapForResults`.

## Acceptance criteria

- [ ] An OID with no coder in `typeMapForResults` decodes to its text form, with no per-OID list; `STRING_OIDS` and `pgTypeParser` are deleted.
- [ ] `_typeMapForResults.defaultTypeMap = map` is ported and `PGResult#mapTypesBang` reads through it.
- [ ] The PostgreSQL lane is green, `adapters/postgresql/array.test.ts` and `range.test.ts` included.
