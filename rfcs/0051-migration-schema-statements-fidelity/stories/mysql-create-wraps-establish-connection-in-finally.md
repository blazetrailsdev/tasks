---
title: "MySQLDatabaseTasks#create wraps the trailing establish_connection in a finally"
status: done
updated: 2026-08-09
rfc: "0051-migration-schema-statements-fidelity"
cluster: null
packages: []
deps: []
deps-rfc: []
est-loc: 60
priority: null
pr: 6281
claim: "2026-08-09T15:39:33Z"
assignee: "migration-context-collaborator-readers-cast-away-the-null-object"
blocked-by: null
closed-reason: null
---

## Context

`MySQLDatabaseTasks#create` (`activerecord/lib/active_record/tasks/mysql_database_tasks.rb:15-19`) is
three sequential statements:

```ruby
def create
  establish_connection(configuration_hash_without_database)
  connection.create_database(db_config.database, creation_options)
  establish_connection
end
```

trails' `packages/activerecord/src/tasks/mysql-database-tasks.ts:57-68` wraps the
middle statement in `try { ... } finally { await this.establishConnection(); }`,
so the trailing re-establish also runs when `createDatabase` raises — where Rails
leaves the pool on the no-database admin config. The in-code comment claims this
protects `DatabaseTasks.create`'s `DatabaseAlreadyExists` rescue
(`tasks/database_tasks.rb`, which swallows it and returns), but Rails has exactly
the same rescue and does not do this, so the divergence is unwarranted as
written.

The same body also carries a trails-only `charsetOverride` parameter, which only
exists to serve trails' non-Rails `purge` (see
`mysql-purge-does-not-call-recreate-database`); converging that story removes the
parameter's only caller.

Surfaced reviewing PR #6278, which converged the body's `create_database` call
but deliberately left the surrounding control flow alone.

## Converged shape

```ts
async create(): Promise<void> {
  await this.establishConnection(this.configurationHashWithoutDatabase());
  await (await this.connection()).createDatabase(
    this.requireDatabaseName(),
    this.creationOptions(),
  );
  await this.establishConnection();
}
```

## Acceptance criteria

- [ ] `create` is three sequential statements with no `try`/`finally`, matching
      `mysql_database_tasks.rb:15-19`.
- [ ] The `charsetOverride` parameter is gone (sequence with, or after,
      `mysql-purge-does-not-call-recreate-database`).
- [ ] Green on the MariaDB lane, including the `db:create`-on-existing-database
      path that motivated the `finally`.
