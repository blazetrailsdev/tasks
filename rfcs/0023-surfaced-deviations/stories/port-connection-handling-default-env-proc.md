---
title: "port-connection-handling-default-env-proc"
status: closed
updated: 2026-08-18
rfc: "0023-surfaced-deviations"
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
closed-reason: "merged into converge-establish-connection-default-env-funnel — that story's scope IS porting DEFAULT_ENV (connection_handling.rb:7) and funnelling every resolver through it"
---

# Port `ConnectionHandling::DEFAULT_ENV` so the three `.call` sites converge

## Context

Rails resolves the default environment through one Proc constant:

- `vendor/rails/activerecord/lib/active_record/connection_handling.rb` —
  `DEFAULT_ENV = -> { RAILS_ENV }`
- `database_configurations.rb:188-190` — `DEFAULT_ENV.call.to_s`
- `database_configurations/database_config.rb:91-93` — `env_name == DEFAULT_ENV.call`
- `migration.rb:1340-1342` — `DEFAULT_ENV.call`

trails has no `DEFAULT_ENV`. Each of the three sites re-derives the value its
own way instead: `DatabaseConfigurations.defaultEnv` hard-codes
`"development"`/`"default"`, `DatabaseConfig#forCurrentEnv` reads a
module-local `_defaultEnvGetter`, and `MigrationContext#currentEnvironment`
delegates to `DatabaseConfigurations.currentEnv()`. Three shapes for one Rails
constant, and all three carry a call-set baseline row for the dropped `call`
(`scripts/api-compare/call-mismatches-exclude/activerecord/{database-configurations,database-configurations/database-config,migration}.json`).

Surfaced while converging the RFC 0108 accessor call-set rows; porting the
constant is the single fix for all three and was out of that PR's scope.

## Acceptance criteria

- [ ] `DEFAULT_ENV` exists in `connection-handling.ts` at the Rails name, as a
      callable that resolves the environment the way `RAILS_ENV` does in trails.
- [ ] The three sites above call it, and the `_defaultEnvGetter` module-local
      goes away.
- [ ] The three `| call` rows are deleted from the exclude tree by hand via
      `serializeBaseline`, then `pnpm parity:api:calls:tighten` on the affected
      shards.
- [ ] `pnpm parity:api:calls` and `pnpm parity:api:calls:args` green.
