---
title: "trails-cli-has-no-app-loader-exec-app"
status: ready
updated: 2026-09-28
rfc: "0142-trailties-surfaced-deviations"
cluster: null
packages: []
deps: []
deps-rfc: []
est-loc: null
priority: 6
pr: null
claim: null
assignee: null
blocked-by: null
closed-reason: null
---

## Context

Rails' `railties/lib/rails/cli.rb:7` runs `Rails::AppLoader.exec_app` first
(`vendor/rails/v8.0.2/railties/lib/rails/app_loader.rb`): inside an app it execs
`bin/rails`, so every application command (`generate`, `routes`, `console`, …) only ever
runs with `APP_PATH` defined. Outside an app the rest of `cli.rb` runs, and everything
except `help` / `plugin` goes to `Rails::Command.invoke :application` (`rails new`).

trails' `createProgram` (`packages/trailties/src/cli.ts`) registers every command
whether or not it is inside an app, with no `exec_app` step. As a result:

- `GenerateCommand#perform` (`commands/generate/generate_command.rb:18-24`) calls
  `boot_application!` and `load_generators` unconditionally, but trails' `generate`
  (`packages/trailties/src/commands/generate.ts`) has to guard both calls on
  `APP_PATH != null`, because it can run outside an app. trails#8216 added that guard.
- `bootApplicationBang` (`packages/trailties/src/command/actions.ts`) raises
  "No config/application.ts found" where Rails' `boot_application!` just skips
  `require_environment!` when `APP_PATH` is undefined (`command/actions.rb:17-20`).

## Acceptance criteria

- Port `Rails::AppLoader` (`find_executable`, `exec_app`), and make `cli.ts`'s dispatch
  mirror `cli.rb`: application commands are available only inside an app, and outside
  one the CLI offers `new` / `help` / `plugin`.
- `bootApplicationBang` mirrors `boot_application!`'s internal `defined?(APP_PATH)` guard
  instead of raising.
- `generate.ts` calls `bootApplicationBang()` and `loadGenerators()` unconditionally, as
  `generate_command.rb:21-22` does, and the `APP_PATH` guard is removed.
