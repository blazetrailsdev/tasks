---
title: "trails package bin outside an app dispatches like rails/cli.rb, not rails/commands"
status: draft
updated: 2026-11-07
rfc: "0142-trailties-surfaced-deviations"
cluster: null
packages: []
deps: []
deps-rfc: []
est-loc: 60
priority: null
pr: null
claim: null
assignee: null
blocked-by: null
closed-reason: null
---

## Context

Rails' gem executable is `railties/lib/rails/cli.rb` (`vendor/rails/v8.0.2/railties/lib/rails/cli.rb:3-21`). It calls `Rails::AppLoader.exec_app` (`:7`), and when that finds no app `bin/rails` it dispatches on `ARGV.first`:

- help, or no argument → `:gem_help`;
- `"plugin"` → `:plugin`;
- anything else → `Rails::Command.invoke :application, ARGV` (`:12-21`).

So `rails server` outside an app reaches the application generator's usage, never `ServerCommand`.

trails' package bin, `packages/trailties/src/bin.ts:1-7`, calls `AppLoader.execApp()` (trails#9842) and then `await import("./commands.js")`. That is the app-side dispatch (Rails' `rails/commands.rb`), not `cli.rb`. With no app found, `trails server` runs `ServerCommand#perform` with `APP_PATH` unset. `requireApplicationBang` (`packages/trailties/src/command/actions.ts:13-20`) imports nothing, and `Dir.chdir(Trails.application.root())` (`packages/trailties/src/commands/server.ts`) throws `TypeError: Cannot read properties of null (reading 'root')`.

trailmap hit this on trailmap#128. Its `bin/trails` wrapper spawned `trailties/bin/trails.js` and never set `APP_PATH`, and `boot`, `image` and `dashboard-e2e` all failed with that TypeError. trailmap worked around it by adding `bin/trails.ts`, a copy of `generators/trails/app/templates/bin/trails.tt`.

## Acceptance criteria

- `bin.ts` mirrors `cli.rb` line for line: `AppLoader.execApp()`, then the `help` / no-argument → `gem_help`, `plugin` → `plugin`, else → `invoke("application", argv)` dispatch, instead of importing `./commands.js`.
- A test runs the package bin with a cwd that has no `bin/trails` and passes `server`. It gets the application command's usage and no `TypeError`.
