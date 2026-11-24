---
title: "examples/twitter-clone converges onto the trails new app layout"
status: draft
updated: 2026-11-24
rfc: "0142-trailties-surfaced-deviations"
cluster: null
packages: ["trailties"]
deps: []
deps-rfc: []
est-loc: 600
priority: null
pr: null
claim: null
assignee: null
blocked-by: null
closed-reason: null
---

## Context

`examples/twitter-clone` is the one example off the standard app shape. It
depends on `tsx` and runs every script through it (`tsx watch src/server.ts`,
`tsx src/cli.ts db:*`, `tsx src/smoke.ts`), serves an Express app
(`src/app.ts`), and replaces `bin/trails` with a hand-rolled `db:*` runner
(`src/cli.ts`, `src/migrator.ts`, `src/database-config.ts`, `src/db.ts`).

What `trails new` generates now is in
`packages/trailties/lib/generators/trails/app/templates` (`bin/trails.tt`,
`config.ts.tt`, `config/application.ts.tt`, `config/environment.ts.tt`,
`config/boot.ts.tt`, `config/environments/*.ts.tt`, `test/test-helper.ts.tt`,
`test/global-setup.ts.tt`, `package.json.tt`, `tsconfig.json.tt`).
`examples/twelve-dollar-server` (an API-only app on `ActionController::API`)
and `examples/chatter` already follow it: `bin/trails`, `trails server`,
`trails db:*`, `config/` + `app/` loaded by Zeitwerk, Node native type
stripping (`.ts` import specifiers, `erasableSyntaxOnly`), vitest tests under
`test/`.

CI runs the example's smoke as `pnpm --filter @blazetrails/example-twitter-clone smoke`
(`.github/workflows/ci.yml`, AR SQLite job, shard 1).

The related story `twitter-clone-smoke-migrations-extend-migration-directly`
(RFC 0141) is done (trails#9284); its fix (`Migration.get(8.0)`) is kept.

## Acceptance criteria

- `tsx` is gone from the example's `package.json` and from every script; no
  file under `examples/twitter-clone` needs it.
- `src/` is removed. The app is `config.ts`, `bin/trails`, `config/`
  (`application.ts`, `boot.ts`, `environment.ts`, `environments/`,
  `routes.ts`, `database.ts`) and `app/models` + `app/controllers`
  (`ApplicationRecord`, `ApplicationController < ActionController::API`),
  autoloaded by Zeitwerk, as `trails new --api` lays them out.
- The Express routes are ported to trails routes and controllers with the same
  paths, statuses and JSON (404 for `RecordNotFound`, 422 for `RecordInvalid`,
  409 for `RecordNotUnique`); `express` is no longer a dependency.
- Scripts are the generated ones: `dev`/`start` = `trails server`,
  `db:*` = `trails db:*`, `build` via `trails-tsc --schema db/schema.ts`;
  deploy is `trails build` (README). An `--api` app has no asset pipeline, so there is
  no `assets:precompile` step, as the generated `--api` Dockerfile omits it
  (`packages/trailties/lib/generators/trails/app/templates/Dockerfile.tt:54-57`).
- The smoke is a vitest test under `test/` booted through
  `test/global-setup.ts` + `test/test-helper.ts`, and CI runs it via the
  example's `test` script.
- README describes the new layout and commands.
