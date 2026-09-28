---
title: "RAILS_ENV() drops the Rails.env arm, so booting an app without TRAILS_ENV resolves default_env"
status: done
updated: 2026-09-28
rfc: "0142-trailties-surfaced-deviations"
cluster: boot
packages: ["activerecord", "trailties"]
deps: []
deps-rfc: []
est-loc: null
priority: null
pr: trails#8201
claim: "2026-09-27T23:44:14Z"
assignee: "migration-generators-bypass-migration-template"
blocked-by: null
closed-reason: null
---

## Context

Found while verifying the root README quickstart (2026-09-27, main `b4f622ae87`).
In a fresh `trails new` app with no `TRAILS_ENV` / `NODE_ENV` set:

- `bin/trails routes` fails, and so does any script that imports
  `config/environment.js`:

  ```text
  ActiveRecord::AdapterNotSpecified: The `default_env` database is not configured for the `default_env` environment.
      at Base.establishConnection (packages/activerecord/src/connection-handling.ts:509)
      at packages/trailties/src/trailties/active-record.ts:257
  ```

- `bin/trails server` and `bin/trails db migrate` work because those
  commands set `TRAILS_ENV` themselves (`packages/trailties/src/commands/server.ts:61`).

Rails' `RAILS_ENV` proc reads `Rails.env` first:
`RAILS_ENV = -> { (Rails.env if defined?(Rails.env)) || ENV["RAILS_ENV"].presence || ENV["RACK_ENV"].presence }`
(`vendor/rails/v8.0.2/activerecord/lib/active_record/connection_handling.rb:6-7`).
`Rails.env` defaults to `"development"`, so a booted app never reaches
`"default_env"`. Trails' port drops that arm under a
`@missingRailsCall Rails.env — PERMANENT` tag
(`packages/activerecord/src/connection-handling.ts:485-490`). The top-level
`Trails` constant is already reachable at call time through `TopLevel.Trails`
(CLAUDE.md § "Call-time constant resolution"), and trails#8131 used exactly
`TopLevel.Trails?.env ?? resolveEnv()` for `loadDatabaseConfig`. So the arm is
convergeable, and the PERMANENT receipt is wrong.

The `active_record.initialize_database` initializer calls `establishConnection()`
with no argument (`packages/trailties/src/trailties/active-record.ts:249-260`),
so it falls through to `DEFAULT_ENV()`.

## Acceptance criteria

- `RAILS_ENV()` reads `TopLevel.Trails?.env` first (the `defined?` guard is
  the `?.`), then `TRAILS_ENV`, then `NODE_ENV`, one arm per Rails arm. The
  `@missingRailsCall Rails.env — PERMANENT` tag is removed.
- In a generated app with no env vars set, `bin/trails routes` and a script
  that imports `config/environment.js` connect to the `development` entry.
- A test covers the `Trails.env` arm, e.g. `Trails.env = "staging"` with no
  `TRAILS_ENV` resolves the `staging` config.
