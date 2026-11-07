---
title: "trails-cli-has-no-app-loader-exec-app"
status: in-progress
updated: 2026-11-07
rfc: "0171-thor-port"
cluster: null
packages: ["trailties"]
deps:
  [
    "vendor-thor-and-port-command-base-thor-surface",
    "find-by-namespace-lookup-loads-only-candidates",
  ]
deps-rfc: []
est-loc: 300
priority: 6
pr: trails#9842
claim: "2026-11-07T17:47:13Z"
assignee: "actionmailbox-router-test-root-mailbox-extends-base"
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

## Thor port (the Thor-port RFC this story is rehomed into)

Part of retiring commander: `retire-commander-cli-onto-rails-command-invoke` depends on it. Estimated at 300.

- [ ] (from the closed duplicate `trails-executable-finds-the-app-like-app-loader`) `AppLoader.execApp` walks up one directory at a time to the first one holding `bin/trails` (`app_loader.rb:45-75`), so `trails routes` run from a generated app's `app/models` boots that app, and `bin.ts` no longer probes `Dir.pwd()` for `dist/config/application.js` / `config/application.ts`.
