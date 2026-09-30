---
title: "Retire commander: bin/trails dispatches through Rails::Command.invoke (cli.rb), and the dependency is removed"
status: ready
updated: 2026-09-30
rfc: "0171-thor-port"
cluster: null
packages: ["trailties"]
deps:
  [
    "port-generate-and-destroy-commands-onto-rails-command-base",
    "port-server-command-onto-rails-command-base",
    "port-console-command-onto-rails-command-base",
    "port-routes-commands-onto-rails-command-base",
    "port-credentials-and-encrypted-commands-onto-rails-command-base",
    "port-notes-stats-and-dev-commands-onto-rails-command-base",
    "move-db-commands-onto-databases-rake-tasks-part-2",
    "move-app-template-command-onto-framework-rake-task",
    "port-application-command-and-argv-scrubber",
    "port-help-and-version-commands-for-split-namespace",
    "trails-cli-has-no-app-loader-exec-app",
    "port-rails-command-base-usage-and-banner",
  ]
deps-rfc: []
est-loc: 350
priority: 2
pr: null
claim: null
assignee: null
blocked-by: null
closed-reason: null
---

## Context

`railties/lib/rails/cli.rb` runs `Rails::AppLoader.exec_app`, then
`Rails::Command.invoke :application, ARGV` outside an app. `bin/rails` inside an app runs
`rails/commands.rb`, which is `Rails::Command.invoke command, ARGV`. trails' entry
(`packages/trailties/src/bin.ts` → `createProgram()` in `packages/trailties/src/cli.ts`) builds
a commander program instead. `command.ts`' `findByNamespace` / `invoke` / `invokeRake`
(`packages/trailties/src/command.ts:14-61`) call back into `createProgram()`.

## Acceptance criteria

- [ ] `bin.ts` mirrors `cli.rb` / `commands.rb` (after `trails-cli-has-no-app-loader-exec-app`),
      and `createProgram()` is deleted. `cli.ts` keeps only its re-exports.
- [ ] `commander` is removed from `packages/trailties/package.json` and the lockfile, and
      `git grep -n '"commander"' packages` is empty.
- [ ] `bin/trails`, `bin/trails --help`, `bin/trails <cmd> --help`, `bin/trails new …` and an
      unknown command print what Rails' equivalents print (with `rails` → `trails`), asserted in
      `cli.test.ts`.
- [ ] The `@missingRailsCall` / `@missingRailsArgs` receipts in `command.ts` that cite commander
      are gone.
