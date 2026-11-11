---
title: "converge-async-lease-call-rows-left-from-rfc0126"
status: draft
updated: 2026-11-11
rfc: "0156-parity-beyond-name-presence"
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

The call-set rows left from `burn-down-rfc0126-repairing-surfaced-call-rows` after trails#9989. They are still baselined in `scripts/api-compare/call-mismatches-exclude/activerecord/` with the RFC 0126 seed reason:

- `sanitization.ts` `sanitize_sql_array` / `sanitize_sql_hash_for_assignment` → `with_connection` (`activerecord/lib/active_record/sanitization.rb:107-115,164-181`). The TS bodies lease through `connectionPool().withConnectionSync`, because `withConnection` (`connection-handling.ts:215`) is async and the sanitizers are synchronous.
- `connection-handling.ts` `connected_to_all_shards` → `map` (`connection_handling.rb:186-190`). This is an awaited `for` loop over `shardKeys`.
- `model-schema.ts` `reset_column_information` → `clear_data_source_cache!` (`model_schema.rb:523-530`). `clearAdapterDataSourceCache` (model-schema.ts:364) reaches the pool's schema reflection instead of `schema_cache.clear_data_source_cache!(table_name)`.
- `nested-attributes.ts` `assign_nested_attributes_for_one_to_one_association` → order `association, callRejectIf` (`nested_attributes.rb:423-460`). Rails reads `send(association_name)` at :434 and only reaches `association(name)` at :448. TS reads `this.association(name)` up front so it can await the one-to-one reader.
- `migration.ts` `Migrator#initialize` → `create_table` (`migration.rb:1421-1433`). Both `create_table` calls are async and run in an awaited Migrator step (migration.ts:1939-1940).

## Acceptance criteria

- Each row is converged and its baseline row deleted. Or, where the blocker is the async connection lease or a constructor's inability to await, the limit is ratified by the repo owner, and the row closes `PERMANENT:` with that ruling.
- `pnpm parity:api:calls` green, with the per-file marks tightened.
