---
title: "pg-statement-pool-and-adapter-residue"
status: done
updated: 2026-08-13
rfc: "0096-naming-identifier-burndown"
cluster: null
packages: []
deps: []
deps-rfc: []
est-loc: null
priority: null
pr: 6483
claim: "2026-08-13T17:25:38Z"
assignee: "pg-statement-pool-and-adapter-residue"
blocked-by: null
closed-reason: null
---

## Context

Split out of `naming-burndown-3-ar-structural-residue` (RFC 0096 wave 3), item 8
plus the item-9 audits that PR did not reach.

1. **`postgresql-adapter.ts#buildStatementPool` (`:4343`)** takes a
   `client: pg.Client` parameter Rails does not have —
   `StatementPool.new(self, type_cast_config_to_integer(@config[:statement_limit]))`
   (`vendor/rails/activerecord/lib/active_record/connection_adapters/postgresql_adapter.rb:1055-1057`).
   trails' `StatementPool` (`postgresql-adapter.ts:4780`) holds `_client` and
   grew a `_detach()` with no Rails counterpart; Rails' pool holds the adapter
   and re-reads `@connection.@raw_connection` at dealloc time, checking
   `conn.status == PG::CONNECTION_OK`. Converging removes both the parameter and
   `_detach`, and folds `_poolFor(client)` back to one pool per adapter.
2. **`postgresql/database-statements.ts#castResult`** — audit against
   `connection_adapters/postgresql/database_statements.rb`.
3. **`mysql/schema-statements.ts#newColumnFromField`** threads a lazy
   `createTableInfoFn` where Rails threads `table_name`
   (`connection_adapters/mysql/schema_statements.rb`).
4. **`encryption/cipher/aes256-gcm.ts#encrypt`** — audit against
   `encryption/cipher/aes256_gcm.rb`.
5. **`associations/has-one-association.ts#replace`** caches `this.target` in a
   `displaced` local at three sites (`:305`, `:344`, `:493`) because the live
   reader mutates mid-method; Rails just reads `target`
   (`associations/has_one_association.rb:59-90`).

## Acceptance criteria

- [ ] Each item is converged, or carries a call-site justification naming the
      specific TypeScript shortcoming, or is re-filed with its Rails `file:line`.
- [ ] No baseline row added, widened or reseeded.
- [ ] Adapter + association tests pass on all three adapters.
