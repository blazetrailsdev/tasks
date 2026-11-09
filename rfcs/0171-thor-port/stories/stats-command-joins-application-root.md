---
title: "stats-command-joins-application-root"
status: ready
updated: 2026-11-09
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

`StatsCommand#perform` (`packages/trailties/src/commands/stats.ts:20-28`) builds each directory as `File.join(Dir.pwd(), dir)` under a `@missingRailsArgs join` receipt. Rails is `Rails::Command.application_root.join(dir)` (`vendor/rails/v8.0.2/railties/lib/rails/commands/stats/stats_command.rb:11-13`); trails has `applicationRoot()` in `command.ts:74`. Swapping it in fails both `commands/stats.test.ts` tests with `Cannot read properties of undefined (reading 'join')`: the tests never set `APP_PATH`.

## Acceptance criteria

- `perform` reads `applicationRoot()!.join(dir)`; the `@missingRailsArgs join` receipt is deleted.
- `stats.test.ts` sets up an application (APP_PATH) as Rails' `stats_test.rb` does via its app fixture.
