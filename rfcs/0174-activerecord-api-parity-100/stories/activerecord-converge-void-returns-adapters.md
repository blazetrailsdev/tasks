---
title: "activerecord: adapter/schema-statement methods return what Rails callers read (void-returns report)"
status: ready
updated: 2026-09-30
rfc: "0174-activerecord-api-parity-100"
cluster: arms
packages: ["activerecord"]
deps: []
deps-rfc: []
est-loc: 400
priority: null
pr: null
claim: null
assignee: null
blocked-by: null
closed-reason: null
---

## Context

`pnpm parity:api:returns` lists **51** activerecord pairs whose Rails return value a Rails caller reads
and whose port returns void (RFC 0156, report-only). The connection-adapter half:
`schema-statements.ts` `createTable`/`dropTable`/`addColumn`/`addIndex`/`removeIndex`;
`abstract-mysql-adapter.ts` `recreateDatabase`/`createDatabase`/`dropTable`; `postgresql-adapter.ts`
`addIndex`/`removeIndex` (×2); `postgresql/schema-statements.ts` `recreateDatabase`/`createDatabase`/
`dropTable`/`addColumn`; `sqlite3-adapter.ts` `removeIndex`/`addColumn`; `mysql/schema-statements.ts`
`createTable`; `schema-definitions.ts` `change`/`removeIndex`; `postgresql/database-statements.ts`
`beginDbTransaction`/`commitDbTransaction`; `postgresql/oid/type-map-initializer.ts` `run`;
`postgresql/schema-dumper.ts` `extensions`; `sqlite3/schema-dumper.ts` `virtualTables`;
`schema-cache.ts` `open`; `abstract/connection-handler.ts` `eachConnectionPool`;
`abstract/connection-pool/reaper.ts` `run`.

## Acceptance criteria

- [ ] Each method returns Rails' value (the `execute` result, the created definition, the enumerator/pool, …) with Rails' type; `pnpm parity:api:returns` lists none of these pairs.
