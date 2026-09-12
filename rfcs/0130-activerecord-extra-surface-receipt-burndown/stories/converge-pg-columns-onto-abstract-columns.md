---
title: "converge-pg-columns-onto-abstract-columns"
status: draft
updated: 2026-09-12
rfc: "0130-activerecord-extra-surface-receipt-burndown"
cluster: null
packages: []
deps: []
deps-rfc: []
est-loc: null
priority: null
pr: null
claim: null
assignee: null
blocked-by: null
closed-reason: null
---

## Context

`packages/activerecord/src/connection-adapters/postgresql/schema-statements.ts` overrides
`columns(tableName)` with its own pg_attribute query. Rails has no PG `columns`: the abstract
`columns` (`connection_adapters/abstract/schema_statements.rb:107`) maps
`column_definitions(table_name)` (`postgresql_adapter.rb:1034`, already ported as
`PostgreSQLAdapter#columnDefinitions`) through `new_column_from_field`, whose
`fetch_type_metadata` calls `get_oid_type` (`postgresql_adapter.rb:854-865`). That method
loads an unknown OID in line via `load_additional_types([oid])` and registers
`Type.default_value` with a warning when the lookup still misses.

In trails `getOidType` is synchronous and `loadAdditionalTypes` is async, so the override
pre-loads every missing OID before building columns. That is why the override survives;
`receipt-moved-adapter-subtrees-and-oid-types` receipted it as
`CONVERGEABLE converge-pg-columns-onto-abstract-columns` (the same PR deleted the PG
`tables` / `views` / `tableExists` / `primaryKey` overrides, which the abstract ports now
answer).

## Acceptance criteria

- The PG `columns` override is deleted; the abstract `columns` answers it through
  `columnDefinitions` + `newColumnFromField`.
- The unknown-OID load lands where Rails puts it (`get_oid_type` →
  `load_additional_types`), made awaitable on the path `newColumnFromField` already awaits,
  with Rails' warning text (`postgresql_adapter.rb:860`).
- Receipt gone, `total` tightened, PG lane green.
