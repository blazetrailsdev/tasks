---
title: "Converge PostgreSQL maxIdentifierLength to synchronous (drop bespoke limit overrides)"
status: claimed
updated: 2026-07-08
rfc: "0051-migration-schema-statements-fidelity"
cluster: null
deps: []
deps-rfc: []
est-loc: 40
priority: null
pr: null
claim: "2026-07-08T23:07:34Z"
assignee: "converge-pg-max-identifier-length-sync"
blocked-by: null
closed-reason: null
---

## Context

Rails' PostgreSQLAdapter#max_identifier_length is **synchronous** — it memoizes
`query_value("SHOW max_identifier_length", "SCHEMA").to_i`
(vendor/rails/activerecord/lib/active_record/connection_adapters/postgresql_adapter.rb:619-622),
so the inherited DatabaseLimits table/alias/index-length methods
(database_limits.rb:11-23) resolve to the real server value (normally 63) on
every call.

trails made `maxIdentifierLength()` **async**
(packages/activerecord/src/connection-adapters/postgresql-adapter.ts:2399), which
breaks the DatabaseLimits receiver-dispatch added in PR #4795: dispatching
`this.maxIdentifierLength()` from the synchronous `tableAliasLength`/`tableNameLength`/
`indexNameLength` mixin would hand a `Promise` to synchronous callers (relation
join-alias tracking). PR #4795 worked around this with three bespoke synchronous
overrides on PostgreSQLAdapter (`?? 63` until the async value caches) — a
divergence from Rails' single sync `max_identifier_length`.

## Acceptance criteria

- [ ] PostgreSQLAdapter resolves `max_identifier_length` synchronously (eager
      at connect / cached like Rails), so the inherited DatabaseLimits
      `tableAliasLength`/`tableNameLength`/`indexNameLength` return the real 63
      via receiver-dispatch with no Promise leak.
- [ ] Delete the three bespoke synchronous limit overrides on PostgreSQLAdapter
      added by PR #4795 once maxIdentifierLength is sync.
- [ ] Non-PG adapters unchanged (MySQL 256, sqlite/abstract 64).
