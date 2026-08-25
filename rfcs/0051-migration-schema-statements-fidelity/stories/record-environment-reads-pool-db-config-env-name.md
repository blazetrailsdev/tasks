---
title: "record_environment should read the pool db_config env name, not a constructor snapshot"
status: done
updated: 2026-08-01
rfc: "0051-migration-schema-statements-fidelity"
cluster: null
deps: []
deps-rfc: []
est-loc: 60
priority: null
pr: 5786
claim: "2026-08-01T02:13:48Z"
assignee: "record-environment-reads-pool-db-config-env-name"
blocked-by: null
closed-reason: null
---

## Context

Rails' `Migrator#record_environment` reads the environment name from the
connection at record time
(`vendor/rails/activerecord/lib/active_record/migration.rb:1513-1517`):

```ruby
def record_environment
  return if down?

  @internal_metadata[:environment] = connection.pool.db_config.env_name
end
```

trails instead resolves the name once in the `Migrator` constructor
(`packages/activerecord/src/migration.ts:2144-2148`) into `_environment`, from
`options.environment ?? TRAILS_ENV ?? NODE_ENV ??
DatabaseConfigurations.defaultEnv`, and reuses that value at every site —
`recordEnvironment`, `checkEnvironment`, `checkProtectedEnvironments`.

The two agree in the common case, but they are not the same source: Rails reads
the _pool's_ `db_config.env_name`, so a Migrator built against a pool whose
config env differs from the ambient process env stamps the pool's name, while
trails stamps the ambient one. The deviation surfaced in PR #5777 as a new wide
call-mismatch (`record_environment` omits `connection`) and was baselined in
`scripts/api-compare/call-mismatches-wide-exclude/activerecord/migration.json`
with that reason rather than converged.

## Acceptance criteria

- `recordEnvironment` sources the environment name from the adapter's pool
  db_config the way Rails does, rather than from a constructor-time snapshot,
  or the divergence is shown to be unobservable and the baseline entry is
  replaced by an explicit justified-deviation note.
- The `record_environment` / `connection` entry is removed from
  `call-mismatches-wide-exclude/activerecord/migration.json` if converged.
- Existing migrator / database-tasks / CLI environment suites pass with no
  test renames.
