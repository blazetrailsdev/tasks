---
title: "converge-pool-and-cache-moved-residue"
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

`receipt-moved-adapter-classes-and-pool` receipted these pool / cache names as
`@noRailsEquivalent CONVERGEABLE converge-pool-and-cache-moved-residue`.

| TS file                                                 | Names                                                                                | Rails                                                                                                                                                                    |
| ------------------------------------------------------- | ------------------------------------------------------------------------------------ | ------------------------------------------------------------------------------------------------------------------------------------------------------------------------ |
| `connection-adapters/abstract/connection-pool.ts`       | interface `enableQueryCache`, `disableQueryCache`, `queryCache`, `queryCacheEnabled` | `abstract/query_cache.rb:139-187` `ConnectionPoolConfiguration`; re-declared on the `ConnectionPool` interface because `Included<>` drops getters and generic signatures |
| `connection-adapters/abstract/connection-pool.ts`       | `toString`                                                                           | none; Rails' pool has only `inspect`                                                                                                                                     |
| `connection-adapters/pool-config.ts`                    | `schemaCache` get/set                                                                | none on `pool_config.rb`; Rails reads `schema_reflection` (`pool_config.rb:11`) and `ConnectionPool#schema_cache` (`connection_pool.rb:285`)                             |
| `connection-adapters/abstract/query-cache.ts`           | `ConnectionPoolConfiguration#dbConfig` declare                                       | `connection_pool.rb:44` `db_config` on the host                                                                                                                          |
| `connection-adapters/schema-cache.ts`                   | `clear`, static `lazilyLoadSchemaCache`                                              | `clear_data_source_cache!` (`schema_cache.rb:73,217,388`); the lazy flag is `ActiveRecord.lazily_load_schema_cache` in `active_record.rb`                                |
| `connection-adapters/abstract/connection-pool/queue.ts` | `length`                                                                             | none; `queue.rb` exposes `num_waiting` / `any_waiting?` (`:21,29`)                                                                                                       |
| `connection-adapters/column.ts`                         | `toString`                                                                           | none in `column.rb`                                                                                                                                                      |
| `connection-adapters/sql-type-metadata.ts`              | `toString`, `toJSON`                                                                 | none in `sql_type_metadata.rb`                                                                                                                                           |

## Acceptance criteria

- Each name is deleted (callers moved onto the Rails reader) or relocated to its Rails file;
  `Included<>` is taught getters/generics so the interface re-declarations can go.
- Every receipt citing this story is gone and activerecord's `total` is tightened.
