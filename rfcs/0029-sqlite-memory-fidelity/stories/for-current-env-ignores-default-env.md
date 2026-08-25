---
title: "for-current-env-ignores-default-env"
status: done
updated: 2026-07-28
rfc: "0029-sqlite-memory-fidelity"
cluster: null
deps: []
deps-rfc: []
est-loc: null
priority: null
pr: 5496
claim: "2026-07-28T12:58:15Z"
assignee: "for-current-env-ignores-default-env"
blocked-by: null
closed-reason: null
---

## Context

`DatabaseConfig#forCurrentEnv` (`packages/activerecord/src/database-configurations/database-config.ts:106`)
resolves its comparison env through a module-local `_defaultEnvGetter`, which is
not wired to `DatabaseConfigurations.defaultEnv`. Setting
`DatabaseConfigurations.defaultEnv = "default_env"` and then reading
`forCurrentEnv` on a config whose `envName` is `"default_env"` returns `false`.

Rails' `DatabaseConfig#for_current_env?` is
`env_name == ActiveRecord::ConnectionHandling::DEFAULT_ENV.call`
(`vendor/rails/activerecord/lib/active_record/database_configurations/database_config.rb`),
i.e. it always reads the live default env.

The knock-on is `DatabaseConfigurations#findDbConfig`
(`database-configurations.ts:202`), whose first pass is gated on
`forCurrentEnv`: it misses 3-level entries entirely and only finds configs via
its `envName`-only fallback. Rails'
`connection_handler_test.rb:34-63` relies on the first pass — it calls
`@handler.establish_connection(:primary)` and expects the `default_env`/`primary`
entry. Discovered while porting that test in PR #5492, which had to route around
`findDbConfig` and resolve through `configsFor` instead.

## Acceptance criteria

- [ ] `DatabaseConfig#forCurrentEnv` reads the live
      `DatabaseConfigurations.defaultEnv`, matching Rails' `for_current_env?`.
- [ ] `findDbConfig(name)` resolves a 3-level entry by `name` under the current
      default env via its first pass, not only via the `envName` fallback.
- [ ] `connection-handler.test.ts`'s "establish connection using 3 levels config"
      resolves its configs through `findDbConfig` (as Rails does) instead of the
      `configsFor` workaround PR #5492 left in place.
- [ ] No test names change.
