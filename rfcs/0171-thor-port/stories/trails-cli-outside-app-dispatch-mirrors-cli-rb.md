---
title: "trails-cli-outside-app-dispatch-mirrors-cli-rb"
status: draft
updated: 2026-11-07
rfc: "0171-thor-port"
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

`Rails::AppLoader.exec_app` is ported (`packages/trailties/src/app-loader.ts`) and
`bin.ts` runs it first, as `vendor/rails/v8.0.2/railties/lib/rails/cli.rb:7` does.
The rest of `cli.rb:9-21` is not: outside an app, Rails dispatches only
`help`/`HELP_MAPPINGS`/nil → `Rails::Command.invoke :gem_help`, `plugin` →
`invoke :plugin`, everything else → `invoke :application`
(`commands/application/application_command.rb`, which hands ARGV through
`Rails::Generators::ARGVScrubber#prepare!` to `AppGenerator.start`).
trails' `bin.ts` still calls `invoke(command, args)` for every command, and
`GemHelpCommand` (`commands/gem_help/gem_help_command.rb` + `USAGE`),
`ApplicationCommand`, `PluginCommand` and `ARGVScrubber` are unported.

## Acceptance criteria

- Port `GemHelpCommand`, `ApplicationCommand` and `ARGVScrubber`; `bin.ts`'s
  post-`execApp` dispatch is `cli.rb`'s `case` line for line.
- Outside an app, `trails generate` reaches `ApplicationCommand` (AppGenerator usage), not `GenerateCommand`.
