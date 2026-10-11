---
title: "initialize-database-retry-fails-after-creating-a-postgres-database"
status: draft
updated: 2026-10-11
rfc: "0189-activerecord-surfaced-deviations"
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

`trails db migrate` against a PostgreSQL database that does not exist creates
the database and then fails:

```text
ActiveRecord::ConnectionNotEstablished:
    at ConnectionPool.checkoutNewConnection (connection-adapters/abstract/connection-pool.ts:1014)
    at ConnectionPool.leaseConnection
    at tasks/database-tasks.ts:930   (initializeDatabase, pool.leaseConnection)
    at DatabaseTasks.withTemporaryPool
    at DatabaseTasks.migrateAll
```

The database exists afterwards (`select datname from pg_database` shows it), so
the `NoDatabaseError` rescue ran `DatabaseTasks.create`; it is the retry that
dies. `initializeDatabase` (`packages/activerecord/src/tasks/database-tasks.ts`)
leases from the pool `withTemporaryPool` handed it, `create` goes through the
maintenance connection and leaves that pool with `automaticReconnect` false, and
the second `pool.leaseConnection()` raises from `checkoutNewConnection`.

Rails' `initialize_database`
(`vendor/rails/v8.0.2/activerecord/lib/active_record/tasks/database_tasks.rb`,
`initialize_database`) is

```ruby
with_temporary_pool(db_config) do
  begin
    database_already_initialized = migration_connection_pool.schema_migration.table_exists?
  rescue ActiveRecord::NoDatabaseError
    create(db_config)
    retry
  end
```

It reads `migration_connection_pool` afresh on each attempt, and `create` ends
by re-establishing the connection, so the retry finds a live pool.

Reproduced on trails#8768 with both a `url:` entry and a plain
adapter/host/database hash, so it is independent of that PR's `UrlConfig` fix.
SQLite is unaffected (connecting creates the file). It leaves the
`NoDatabaseError` arm of `captureMigrateState`
(`packages/trailties/src/commands/db.ts`) without an end-to-end test.

## Acceptance criteria

- [ ] `initializeDatabase` reads the pool the way Rails does on each attempt, and
      `db migrate` / `db prepare` against an absent PostgreSQL database creates
      it, then loads the schema or runs the migrations.
- [ ] A PostgreSQL-lane test covers it and fails on the current code with
      `ConnectionNotEstablished`.
- [ ] The trailties `db command multi-database parity` Postgres test gains the
      absent-database `migrate` case: it prints the migration lines and neither
      "All migrations are up to date." nor "Loaded schema from" when no schema
      file exists.
