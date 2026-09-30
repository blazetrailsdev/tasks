---
title: "activerecord: move the database/schema-statement bodies inlined into the adapter classes"
status: ready
updated: 2026-09-30
rfc: "0174-activerecord-api-parity-100"
cluster: placement
packages: ["activerecord"]
deps: []
deps-rfc: []
est-loc: 350
priority: null
pr: null
claim: null
assignee: null
blocked-by: null
closed-reason: null
---

## Context

`pnpm parity:api:extra --package activerecord` reports **128** "inlined module bodies" — a Ruby
module member whose TS body sits on an including class's file instead of the file mirroring the module
(the mirror image of `moved`). It is report-only today, so nothing stops it growing; CLAUDE.md
§ "Decomposition" and § "Module mixins" require the body in the module's file, reached through
`include()` / `this`-typed functions. This story takes 8:

- `connection_adapters/sqlite3/schema_statements.rb` → `connection-adapters/sqlite3-adapter.ts#createTableDefinition`, `connection-adapters/sqlite3-adapter.ts#schemaCreation`
- `connection_adapters/abstract/database_statements.rb` → `connection-adapters/abstract-adapter.ts#_transactionManager`, `connection-adapters/abstract-adapter.ts#constructor`
- `connection_adapters/postgresql/database_statements.rb` → `connection-adapters/postgresql-adapter.ts#_cancelAnyRunningQuery`
- `connection_adapters/mysql/schema_statements.rb` → `connection-adapters/abstract-mysql-adapter.ts#removeForeignKey`
- `connection_adapters/mysql/database_statements.rb` → `connection-adapters/abstract-mysql-adapter.ts#_maxAllowedPacket`
- `connection_adapters/abstract/query_cache.rb` → `connection-adapters/abstract-adapter.ts#_queryCache`

## Acceptance criteria

- [ ] Each body lives in the TS file mirroring its `.rb`, and the host reaches it through `include()` / `Included<>` or a `this`-typed function assigned to the class — no delegation wrapper.
- [ ] `pnpm parity:api:extra --package activerecord` lists none of these `inlined-from` rows; activerecord stays rowless on `parity:api:extra:gate`.
- [ ] `pnpm lint --fix` (`rails-file-structure-method-order`) leaves the moved members in Rails source order.
- [ ] No behaviour change: the touched model/relation/adapter test files are green on SQLite (and PG/MySQL for adapter files).

## Verification

```bash
pnpm parity:api:extra --package activerecord && pnpm parity:api:moves && pnpm parity:api:extra:gate && pnpm lint --fix
```
