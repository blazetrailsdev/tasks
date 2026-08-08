---
title: "withTemporaryPool asserts originalDbConfig non-null in its finally, masking the body's error"
status: done
updated: 2026-08-08
rfc: "0051-migration-schema-statements-fidelity"
cluster: null
packages: []
deps: []
deps-rfc: []
est-loc: 90
priority: null
pr: 6239
claim: "2026-08-08T15:16:01Z"
assignee: "generate-migrator-advisory-lock-id-probes-and-falls-back"
blocked-by: null
closed-reason: null
---

## Context

Surfaced while converging `DatabaseTasks.migrationClass` in PR #6220 (the
receiver was converged; this assertion was not touched).

Rails (`activerecord/lib/active_record/tasks/database_tasks.rb:543-549`):

```ruby
def with_temporary_pool(db_config, clobber: false)
  original_db_config = migration_class.connection_db_config
  pool = migration_class.connection_handler.establish_connection(db_config, clobber: clobber)

  yield pool
ensure
  migration_class.connection_handler.establish_connection(original_db_config, clobber: clobber)
end
```

trails (`packages/activerecord/src/tasks/database-tasks.ts`,
`withTemporaryPool`) reads the original config **inside** the `try` and asserts
non-null in the `finally`:

```ts
let originalDbConfig: DatabaseConfig | undefined;
try {
  originalDbConfig = migrationClass.connectionDbConfig();
  ...
} finally {
  await migrationClass.connectionHandler.establishConnection(originalDbConfig!, { ... }).adapterReady;
}
```

Two divergences from `:544,549`:

1. In Ruby, `original_db_config = migration_class.connection_db_config` raising
   leaves the local `nil`, and `ensure` calls
   `establish_connection(nil)` — which `Base.establish_connection` resolves as
   "use the default environment" (`connection_handling.rb`). Ours passes
   `undefined` through a `!` into a handler typed for a real config, so the
   restore either throws a second error out of the `finally` (masking the first)
   or establishes against a bogus config.
2. Rails' assignment is the first statement of the method, outside the
   `establish_connection` that can fail; ours is inside the same `try`, which is
   what makes the `undefined` state reachable at all.

The `!` is the tell: it asserts an invariant the control flow does not provide.

## Converged shape

Read `originalDbConfig` before the `try`, as Ruby does at `:544`, so the
`finally` always has a real value and the assertion disappears. If
`connectionDbConfig()` can legitimately answer nothing, port Rails' nil arm
explicitly (`establish_connection(nil)` → resolve the default env) rather than
asserting it away.

## Acceptance criteria

- [ ] No `!` assertion on `originalDbConfig` in `withTemporaryPool`.
- [ ] The config is read before the `establish_connection` that can fail
      (`:544` order).
- [ ] With nothing established, `withTemporaryPool` restores the way Rails'
      `ensure` does rather than throwing out of the `finally` and masking the
      body's error.
- [ ] `packages/activerecord/src/tasks/` green.
