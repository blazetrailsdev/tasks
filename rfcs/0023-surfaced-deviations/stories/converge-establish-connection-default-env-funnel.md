---
title: "Port DEFAULT_ENV and collapse establishConnection's trails-only autoConnect arm"
status: draft
updated: 2026-08-12
rfc: "0023-surfaced-deviations"
cluster: null
packages: []
deps: []
deps-rfc: []
est-loc: 220
priority: null
pr: null
claim: null
assignee: null
blocked-by: null
closed-reason: null
---

## Context

Found while converging `establish_connection`'s call arguments in PR #6418.
Rails has no separate no-argument path:

```ruby
# vendor/rails/activerecord/lib/active_record/connection_handling.rb:7
DEFAULT_ENV = -> { RAILS_ENV.call || "default_env" }

# :50-53
def establish_connection(config_or_env = nil)
  config_or_env ||= DEFAULT_ENV.call.to_sym
  db_config = resolve_config_for_connection(config_or_env)
  connection_handler.establish_connection(db_config, owner_name: self, role: current_role, shard: current_shard)
end
```

Every input — nil included — funnels through `resolve_config_for_connection`.
trails' `establishConnection` (`packages/activerecord/src/connection-handling.ts`)
instead branches: `config === undefined` goes to a trails-only `autoConnect()`
that loads `config/database.*` or `DATABASE_URL`, builds a
`DatabaseConfigurations`, picks a config by `DatabaseConfigurations.currentEnv()`
and calls `establishWithDbConfig` directly. There is no `DEFAULT_ENV` constant
in the port at all — `database-configurations.ts:544` and `migration.ts:2121`
both name it only in comments, routing through
`DatabaseConfigurations.currentEnv()` instead.

The call-set gate still records the omission: Rails' `DEFAULT_ENV.call` has no
counterpart in the TS body.

## Converged shape

Port `DEFAULT_ENV` as an exported lambda-equivalent in `connection-handling.ts`
(reading `RAILS_ENV` the way the port already resolves it) and collapse
`establishConnection`'s two arms into Rails' single funnel:
`configOrEnv ??= DEFAULT_ENV(); resolveConfigForConnection(configOrEnv)`. The
config-file discovery `autoConnect` does is Rails' `configurations` loading,
which belongs behind `Base.configurations` / `resolve_config_for_connection`,
not behind a second entry point — that is the part to relocate rather than
delete.

## Acceptance criteria

- [ ] `connection-handling.ts` exports `DEFAULT_ENV` and `establishConnection`
      has a single path through `resolveConfigForConnection`, matching
      `connection_handling.rb:50-53`.
- [ ] The trails-only `autoConnect` entry point is gone (its config discovery
      relocated, not deleted).
- [ ] `pnpm parity:api:calls` records the `call` credit for
      `establish_connection` with no new baseline rows.
- [ ] Connection-handling, connection-pool and multi-db suites green on all
      three lanes.
