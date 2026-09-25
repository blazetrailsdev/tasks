---
title: "Trails.env omits the RACK_ENV (NODE_ENV) arm of Rails.env"
status: done
updated: 2026-09-25
rfc: "0142-trailties-surfaced-deviations"
cluster: null
packages: []
deps: []
deps-rfc: []
est-loc: 30
priority: 2
pr: trails#8096
claim: "2026-09-25T16:51:41Z"
assignee: "generated-environments-omit-namespaced-framework-settings"
blocked-by: null
closed-reason: null
---

## Context

`Trails.env` (`packages/trailties/src/rails.ts`) is built from `resolveEnv()`
(`packages/trailties/src/database.ts`), which is `env.TRAILS_ENV || "development"`.

Rails' `Rails.env` (`vendor/rails/railties/lib/rails.rb:72-74`) is
`EnvironmentInquirer.new(ENV["RAILS_ENV"].presence || ENV["RACK_ENV"].presence || "development")`.
The `RACK_ENV` arm is missing. Elsewhere, trails spells that arm `NODE_ENV`:
`RAILS_ENV()` in `packages/activerecord/src/connection-handling.ts`, `info.ts:64`,
and, since #8077, `commandEnvironment()` in `packages/trailties/src/commands/server.ts`
(the port of `Rails::Command.environment`, `railties/lib/rails/command.rb:51-53`).

So with only `NODE_ENV=production` set, Active Record and `trails server` see
`production`, but `Trails.env` says `development`. Every railtie initializer that
reads `Trails.env` (for example `active_model.secure_password`, or
`Rails.env.local?` in `loadDefaults` 7.1) disagrees with Active Record's
`DEFAULT_ENV`.

## Converged shape

`resolveEnv` / `Trails.env` read
`presence(TRAILS_ENV) ?? presence(NODE_ENV) ?? "development"`, one arm per arm of
`rails.rb:74`. The server's `commandEnvironment` and AR's `RAILS_ENV()` then
agree with it.

## Acceptance criteria

- `Trails.env` honours `NODE_ENV` when `TRAILS_ENV` is blank, as `Rails.env`
  honours `RACK_ENV`.
- Blank values fall through, as `.presence` does.
- A test covers `NODE_ENV=production` with `TRAILS_ENV` unset.
