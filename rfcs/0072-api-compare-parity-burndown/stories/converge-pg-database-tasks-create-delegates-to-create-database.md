---
title: "Route PostgreSQLDatabaseTasks#create through connection.createDatabase"
status: done
updated: 2026-08-05
rfc: "0072-api-compare-parity-burndown"
cluster: null
deps: []
deps-rfc: []
est-loc: 150
priority: null
pr: 6135
claim: "2026-08-05T16:33:09Z"
assignee: "check-current-protected-environment-pool-migration-context-blocked-on-adapter-proxy"
blocked-by: null
closed-reason: null
---

## Context

Surfaced while shipping #5886 (`converge-pg-create-database-option-string-construction`,
RFC 0072), which converged `PostgreSQL::SchemaStatements#create_database` to
Rails' merged-hash option-string construction.

Rails' `PostgreSQLDatabaseTasks#create` delegates the whole job to that method,
passing the entire configuration hash
(`vendor/rails/activerecord/lib/active_record/tasks/postgresql_database_tasks.rb:20-24`):

```ruby
def create(connection_already_established = false)
  establish_connection(public_schema_config) unless connection_already_established
  connection.create_database(db_config.database, configuration_hash.merge(encoding: encoding))
  establish_connection
end
```

trails hand-builds the DDL instead
(`packages/activerecord/src/tasks/postgresql-database-tasks.ts:89-99`):

```ts
const sql = `CREATE DATABASE "${this.escapeIdent(dbName)}" ENCODING '${this.escapeSingle(encoding)}'`;
await conn.executeMutation(sql);
```

Consequences:

- Only `encoding` is honoured. A config carrying `owner`, `template`,
  `collation`, `ctype`, `tablespace`, or `connectionLimit` silently produces a
  database without them, where Rails emits each one.
- The emitted SQL differs from `createDatabase`'s: `ENCODING 'utf8'` (no `=`)
  versus Rails' `ENCODING = 'utf8'`, and a bespoke `escapeIdent` rather than
  `quoteTableName`.
- `executeMutation` is used where Rails goes through `execute`
  ([[project_execute_mutation_split_is_the_deviation]]).

PR #5886 removed the blocker: `createDatabase` now iterates the merged hash and
lets unrecognised config keys (`adapter`, `host`, …) fall through the no-op arm,
so the whole `configurationHash` can be passed straight in as Rails does.

Check `drop` in the same file against
`postgresql_database_tasks.rb:26-29` while there — Rails delegates to
`connection.drop_database`.

## Acceptance criteria

- `PostgreSQLDatabaseTasks#create` calls `connection.createDatabase(dbName, { ...configurationHash, encoding })`
  rather than assembling its own `CREATE DATABASE` string.
- The duplicate-database rescue behaviour is preserved (Rails raises
  `DatabaseAlreadyExists` via the task's own translation).
- `drop` delegates to `connection.dropDatabase` if it does not already.
- The bespoke `escapeIdent` / `escapeSingle` helpers are removed if this was
  their last caller.
- `packages/activerecord/src/tasks/postgresql-database-tasks.test.ts` passes,
  with any Rails-named test from
  `vendor/rails/activerecord/test/cases/tasks/postgresql_rake_test.rb` that
  covers the option pass-through ported verbatim.
