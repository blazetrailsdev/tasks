---
title: "activerecord: PostgreSQL and MySQL wire casts register where Rails configures the driver"
status: draft
updated: 2026-10-02
rfc: "0174-activerecord-api-parity-100"
cluster: null
packages: ["activerecord"]
deps: []
deps-rfc: []
est-loc: 250
priority: null
pr: null
claim: null
assignee: null
blocked-by: null
closed-reason: null
---

## Context

Surfaced by the `activerecord-audit-permanent-receipts-ca-drivers` audit: the 2 receipts below were
`@noRailsEquivalent PERMANENT`, no CLAUDE.md section ratifies them, and they are re-tagged
`CONVERGEABLE` onto this story.

Both functions decide how a driver turns a wire value into a JS value, which Rails configures at a named
place in each adapter:

- `packages/activerecord/src/connection-adapters/postgresql/temporal-type-parsers.ts`
  `makeGetTypeParser` builds the `types.getTypeParser` override handed to `node-pg`: a fixed OID table
  (`timestamptz`, `timestamp`, `date`, `int8`, plus pass-throughs for `circle`, `point` and five array
  OIDs). Rails does this in `PostgreSQLAdapter#add_pg_decoders`
  (`vendor/rails/v8.0.2/activerecord/lib/active_record/connection_adapters/postgresql_adapter.rb:1112-1151`):
  it looks the OIDs up by `typname`, builds a `PG::TypeMapByOid`, and assigns it to
  `@raw_connection.type_map_for_results`; `update_typemap_for_default_timezone` then swaps the
  `timestamp` decoder when `default_timezone` changes. The trails table is static, keyed by hard-coded
  OIDs, and built outside the adapter.
- `packages/activerecord/src/connection-adapters/mysql/temporal-type-cast.ts` `temporalTypeCast` is the
  `typeCast` pool option handed to `mysql2`: it casts `TIMESTAMP` / `DATETIME` / `DATE` / `DECIMAL` /
  `LONGLONG` fields. Rails leaves the cast to the Mysql2 gem and steers it per query:
  `raw_connection.query_options[:database_timezone] = default_timezone`
  (`vendor/rails/v8.0.2/activerecord/lib/active_record/connection_adapters/mysql2/database_statements.rb:49`,
  and `mysql2_adapter.rb:160`).

## Acceptance criteria

- [ ] The PostgreSQL result decoders are registered from `add_pg_decoders`, at its Rails name and on the
      adapter, and `makeGetTypeParser` is deleted or is a private detail of that method with no receipt.
- [ ] The MySQL cast is installed where Rails sets the connection's query options, and
      `temporalTypeCast` is deleted or is a private detail of that site with no receipt.
- [ ] Neither receipt remains; `pnpm parity:api:extra:gate` and `pnpm parity:api:receipts:gate` green;
      no mark or baseline widened.
- [ ] The PostgreSQL and MySQL date/time round-trip tests pass on their lanes.

## Verification

```bash
pnpm parity:api:extra:gate && pnpm parity:api:receipts:gate && pnpm vitest run packages/activerecord/src/connection-adapters/postgresql/temporal-type-parsers.trails.test.ts
```
