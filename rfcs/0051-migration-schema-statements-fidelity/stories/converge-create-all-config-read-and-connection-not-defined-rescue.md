---
title: "converge-create-all-config-read-and-connection-not-defined-rescue"
status: done
updated: 2026-08-08
rfc: "0051-migration-schema-statements-fidelity"
cluster: null
packages: []
deps: []
deps-rfc: []
est-loc: null
priority: null
pr: 6222
claim: "2026-08-08T09:03:57Z"
assignee: "converge-create-all-config-read-and-connection-not-defined-rescue"
blocked-by: null
closed-reason: null
---

## Context

Surfaced while converging `DatabaseTasks.migrationClass` in PR #6220.

Rails (`activerecord/lib/active_record/tasks/database_tasks.rb:127-133`):

```ruby
def create_all
  db_config = migration_connection.pool.db_config

  each_local_configuration { |db_config| create(db_config) }

  migration_class.establish_connection(db_config)
end
```

trails (`packages/activerecord/src/tasks/database-tasks.ts`, `createAll`) reads
the config a different way and guards it:

```ts
const migrationClass = this.migrationClass();
let originalConfig: DatabaseConfig | null = null;
try {
  originalConfig = migrationClass.connectionDbConfig();
} catch (error) {
  if (!(error instanceof ConnectionNotDefined)) throw error;
}
```

Two deviations from `:128`:

1. Rails goes through `migration_connection.pool.db_config` — it leases a
   connection and reads the config off _that pool_. Ours calls
   `migrationClass.connectionDbConfig()`, skipping the lease.
2. Rails does not rescue: with nothing established, `migration_connection`
   raises `ConnectionNotDefined` out of `create_all`. Ours swallows it and
   skips the re-establish at `:132`, so `create_all` succeeds where Rails
   raises.

PR #6220 converged only the receiver (`migrationClass()` instead of a dynamic
`await import("../base.js")`); the shape of the read and the rescue are
untouched.

## Acceptance criteria

- [ ] `createAll` reads the config as `migrationConnection().pool.dbConfig`
      (`:128`), not `migrationClass().connectionDbConfig()`.
- [ ] The `ConnectionNotDefined` rescue is gone — with nothing established,
      `createAll` raises as Rails does — or, if a trails test depends on the
      lenient arm, that test is restated against Rails' behaviour first.
- [ ] `migrationClass().establishConnection(dbConfig)` runs unconditionally
      after the creates (`:132`), matching Rails' unguarded call.
- [ ] `packages/activerecord/src/tasks/` green.
