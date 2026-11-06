---
title: "trailties-env-helpers-with-rails-env-and-rack-env"
status: ready
updated: 2026-11-06
rfc: "0212-trailties-port"
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

`packages/trailties/src/test-helpers/env-helpers.ts` ports only `EnvHelpers#switch_env` (`vendor/rails/v8.0.2/railties/test/env_helpers.rb:21-26`), landed by trails#9771. Rails' module also defines `with_rails_env` and `with_rack_env` (`env_helpers.rb:7-19`). Each one clears `Rails.instance_variable_set :@_env, nil` and then nests two `switch_env` calls. trails' only reset is `_resetTrailsEnv` in `packages/trailties/src/trails.ts:177`, which also clears `_backtraceCleaner`. So the port needs a reset of `_env` alone, or a different seat for it. `packages/trailties/src/application/configuration.test.ts:24-41` has a local `switchEnv` / `withTrailsEnv` copy, and that copy should move onto `EnvHelpers`.

## Acceptance criteria

- `EnvHelpers` carries `withTrailsEnv` / `withRackEnv` with Rails' control flow, and the reset clears only the memoized env.
- `configuration.test.ts` uses `EnvHelpers` and drops its local copies.
