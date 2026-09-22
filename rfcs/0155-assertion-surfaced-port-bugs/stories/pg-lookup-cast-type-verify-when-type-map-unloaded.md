---
title: "Converge PG lookup_cast_type_from_column's verify! guard out of build_fixture_sql"
status: ready
updated: 2026-09-22
rfc: "0155-assertion-surfaced-port-bugs"
cluster: null
packages: []
deps: []
deps-rfc: []
est-loc: 60
priority: null
pr: null
claim: null
assignee: null
blocked-by: null
closed-reason: null
---

## Context

Rails' PostgreSQL `lookup_cast_type_from_column` verifies a connection whose type map is not loaded before it looks the type up:

```ruby
# vendor/rails/activerecord/lib/active_record/connection_adapters/postgresql/quoting.rb:189-191
def lookup_cast_type_from_column(column) # :nodoc:
  verify! if type_map.nil?
  type_map.lookup(column.oid, column.fmod, column.sql_type)
end
```

Pool checkout does not verify (`connection_pool.rb:942-951` `checkout_and_verify` only runs `clean!`), so this guard is what connects a lazily-opened connection.

trails' `PostgreSQLAdapter#lookupCastTypeFromColumn` (`packages/activerecord/src/connection-adapters/postgresql-adapter.ts`) is synchronous. It throws `ConnectionNotEstablished` instead and carries `@missingRailsCall verify! — PERMANENT`. trails#7843 hit this: `FixtureSet.insert` no longer runs a reflection query before `insert_fixtures_set`, so on a fresh connection `build_fixture_sql` reached the lookup unconfigured. The fix moved the guard to the async caller, `buildFixtureSql` (`connection-adapters/abstract/database-statements.ts`): `if (this.typeMap == null) await this.verifyBang?.();`. Rails' `build_fixture_sql` (`abstract/database_statements.rb:607-608`) has no such line.

## Acceptance criteria

- The `verify! if type_map.nil?` guard lives where Rails puts it, in PostgreSQL's `lookup_cast_type_from_column`, or its async equivalent is reached through that method. It is not a line in `buildFixtureSql`.
- The `typeMap == null` / `verifyBang` line is deleted from `buildFixtureSql`.
- `transactions.test.ts` "connection removed from pool when …" and `transaction-instrumentation.test.ts` "… on failed rollback when unmaterialized" stay green on the PostgreSQL lane.
