---
title: "Port Rails::Command.application_root and use it in StatsCommand"
status: draft
updated: 2026-11-01
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
closed-reason: null
---

## Context

`Rails::Command.application_root` is `Pathname.new(File.expand_path("../..", APP_PATH)) if defined?(APP_PATH)` (`vendor/rails/v8.0.2/railties/lib/rails/command.rb:110-112`), and `StatsCommand#perform` joins each directory to it (`vendor/rails/v8.0.2/railties/lib/rails/commands/stats/stats_command.rb:11`). trails has no `applicationRoot`, and `packages/trailties/src/commands/stats.ts` joins to `Dir.pwd()`, because `bin.ts` may set `APP_PATH` to `dist/config/application.js`, where `../..` is `dist`.

## Acceptance criteria

- [ ] `applicationRoot` is ported in `command.ts` and answers the application root for a `dist/` `APP_PATH` too.
- [ ] `StatsCommand#perform` joins to it, and its `@missingRailsArgs join` receipt is removed.
