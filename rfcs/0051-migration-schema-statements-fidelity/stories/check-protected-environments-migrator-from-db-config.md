---
title: "Build checkProtectedEnvironments' migrator from its dbConfig and compare against currentEnvironment"
status: done
updated: 2026-08-01
rfc: "0051-migration-schema-statements-fidelity"
cluster: null
deps: []
deps-rfc: []
est-loc: 60
priority: null
pr: 5771
claim: "2026-07-31T23:40:41Z"
assignee: "check-protected-environments-migrator-from-db-config"
blocked-by: null
closed-reason: null
---

## Context

PR #5759 routed all six `DatabaseTasks` migrator constructions through a shared
`_migratorFor(adapter, dbConfig)` helper that threads
`environment: dbConfig.envName` / `internalMetadataEnabled: dbConfig.useMetadataTable`.
One hand-built migrator was left behind, in
`checkProtectedEnvironments`
(`packages/activerecord/src/tasks/database-tasks.ts:606`):

```ts
const migrator = new Migrator(adapter, [], {
  internalMetadataEnabled: config.useMetadataTable,
});
const stored = await migrator.lastStoredEnvironment();
if (stored && protectedEnvs.includes(stored)) { ... }
if (stored && stored !== envName) { ... }
```

It was out of #5759's scope (that story enumerated the six migrate/status
sites), but it has the same shape of divergence plus two more:

1. No `environment` option, so the migrator's `currentEnvironment` falls back to
   `TRAILS_ENV` / `NODE_ENV` rather than `config.envName`.
2. Rails compares `stored` against `migration_context.current_environment`, not
   against the method's `environment` argument
   (`vendor/rails/activerecord/lib/active_record/tasks/database_tasks.rb:635-650`):

   ```ruby
   def check_current_protected_environment!(db_config)
     with_temporary_pool(db_config) do |pool|
       migration_context = pool.migration_context
       current = migration_context.current_environment
       stored  = migration_context.last_stored_environment
       raise ActiveRecord::ProtectedEnvironmentError.new(stored) if migration_context.protected_environment?
       raise ActiveRecord::EnvironmentMismatchError.new(current: current, stored: stored) if stored && stored != current
     rescue ActiveRecord::NoDatabaseError
     end
   end
   ```

3. Rails asks `migration_context.protected_environment?` rather than testing
   membership of `stored` in a locally-computed `protectedEnvs` list.

Net effect: in a multi-environment setup, the protected-environment check can
compare the stored stamp against the wrong "current" environment.

## Acceptance criteria

- [ ] `checkProtectedEnvironments`' migrator is built with `environment`
      derived from the in-hand `config`, matching the other sites.
- [ ] `stored` is compared against the migrator's `currentEnvironment`, as
      Rails does, not against the `environment` argument.
- [ ] The protected check goes through the migrator's
      `protectedEnvironment?`-equivalent instead of a local list membership
      test, or the reason it cannot is stated at the call site.
- [ ] Regression coverage: a config whose `envName` differs from
      `TRAILS_ENV` / `NODE_ENV` is checked against its own env. Confirm the
      test fails on baseline.
