---
title: "Port Rails::Command.application_root and use it in StatsCommand"
status: closed
updated: 2026-11-03
rfc: "0171-thor-port"
cluster: null
packages: []
deps: []
deps-rfc: []
est-loc: 40
priority: null
pr: null
claim: null
assignee: null
blocked-by: null
closed-reason: "FALSIFIED: its premise 'trails has no applicationRoot' no longer holds — applicationRoot landed in command.ts:75 (trails#9553); the remaining stats.ts join is receipted to and owned by trails-cli-has-no-app-loader-exec-app, and the dist/ APP_PATH strip by app-path-expands-to-the-application-root"
---

## Context

`Rails::Command.application_root` is `Pathname.new(File.expand_path("../..", APP_PATH)) if defined?(APP_PATH)` (`vendor/rails/v8.0.2/railties/lib/rails/command.rb:110-112`), and `StatsCommand#perform` joins each directory to it (`vendor/rails/v8.0.2/railties/lib/rails/commands/stats/stats_command.rb:11`). trails has no `applicationRoot`, and `packages/trailties/src/commands/stats.ts` joins to `Dir.pwd()`, because `bin.ts` may set `APP_PATH` to `dist/config/application.js`, where `../..` is `dist`.

## Acceptance criteria

- [ ] `applicationRoot` is ported in `command.ts` and answers the application root for a `dist/` `APP_PATH` too.
- [ ] `StatsCommand#perform` joins to it, and its `@missingRailsArgs join` receipt is removed.
