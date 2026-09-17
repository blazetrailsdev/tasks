---
title: "Converge bodies whose PERMANENT call receipts hide a real behavioural divergence"
status: draft
updated: 2026-09-17
rfc: "0130-activerecord-extra-surface-receipt-burndown"
cluster: null
packages: ["activerecord"]
deps: []
deps-rfc: []
est-loc: 380
priority: null
pr: null
claim: null
assignee: null
blocked-by: null
closed-reason: null
---

## Context

Found by the PERMANENT-receipt audit. Each receipt below suppresses a real call
the Rails body makes, and the TS body does something observably different —
not a JS spelling of the same call:

| trails                                                                            | receipt                   | Rails                                     | divergence                                                                                                                                                                             |
| --------------------------------------------------------------------------------- | ------------------------- | ----------------------------------------- | -------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------- |
| `connection-adapters/mysql2/database-statements.ts:73` `selectAll`                | `unprepared_statement`    | `mysql2/database_statements.rb:8-14`      | drops the `ExplainRegistry.collect? && prepared_statements` arm and `super`                                                                                                            |
| `persistence.ts:113` `instantiate`                                                | `instantiate_instance_of` | `persistence.rb:100-103`                  | inlines the private helper                                                                                                                                                             |
| `integration.ts:144` `canUseFastCacheVersion`                                     | `with_connection`         | `integration.rb:184`                      | reads global `defaultTimezone()` instead of the connection's                                                                                                                           |
| `insert-all.ts:192` `primaryKeys`                                                 | `table_name`              | `insert_all.rb:61-63`                     | reads pre-resolved `_facts` (also `insert-all.ts:30,43` `ResolvedConnectionFacts`/`resolveConnectionFacts`, receipted but unmeasured)                                                  |
| `connection-adapters/postgresql/quoting.ts:240` `lookupCastType`                  | `query_value`, `quote`    | `postgresql/quoting.rb:195-197`           | parses `sql_type` locally instead of `::regtype::oid` (prior art `converge-pg-lookup-cast-type-regtype-oid-query` closed, `pg-lookup-cast-type-resolves-by-name-not-regtype-oid` done) |
| `connection-adapters/abstract-mysql-adapter.ts:921` `quoteString`                 | `with_raw_connection`     | `abstract_mysql_adapter.rb:695-699`       | hand-rolled escaping instead of the driver's `escape`                                                                                                                                  |
| `connection-adapters/sqlite3/quoting.ts:61` `quoteString`                         | `quote`                   | `sqlite3/quoting.rb:66`                   | hand-rolled escaping                                                                                                                                                                   |
| `connection-adapters/sqlite3/schema-statements.ts:345` `quotedScope`              | `quote`                   | `sqlite3/schema_statements.rb:192`        | hand-quotes `name` instead of `quote(name)` (`:203`)                                                                                                                                   |
| `associations/collection-association.ts:520` `reader`                             | `reload`                  | `collection_association.rb:34-40`         | stale target resets without reloading                                                                                                                                                  |
| `associations/disable-joins-association-scope.ts:42,71` `scope`, `lastScopeChain` | `add_constraints`         | `disable_joins_association_scope.rb:6-30` | constraints deferred into an async walker                                                                                                                                              |
| `gem-version.ts:13` `gemVersion`                                                  | `new`                     | `gem_version.rb`                          | returns a String, Rails returns `Gem::Version`                                                                                                                                         |

## Acceptance criteria

- Each body makes the Rails call (or its receipt is relabelled
  `CONVERGEABLE <story-id>` against an open story that owns a genuinely
  separate blocker), and no receipt above stays PERMANENT.
- Adapter-specific changes run on their CI lane; split adapters vs. model code
  if the diff exceeds the LOC ceiling.
