---
title: "code-statistics-create-stands-in-for-new"
status: draft
updated: 2026-11-09
rfc: "0142-trailties-surfaced-deviations"
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

# CodeStatistics.create stands in for CodeStatistics.new

## Context

`Rails::CodeStatistics#initialize` (`vendor/rails/v8.0.2/railties/lib/rails/code_statistics.rb:61-65`) computes `@statistics` and `@total` in the constructor. `packages/trailties/lib/code-statistics.ts` has a private constructor and an async `static create`, because the directory walk uses async fs. `StatsCommand#perform` (`packages/trailties/lib/commands/stats.ts`) carries `@missingRailsCall new` for it.

## Acceptance criteria

- `new CodeStatistics(...pairs)` is the construction path, as Rails' `CodeStatistics.new(*stat_directories).to_s` (`vendor/rails/v8.0.2/railties/lib/rails/commands/stats/stats_command.rb`). The async walk is awaited where the statistics are first read.
- The `@missingRailsCall new` receipt in `commands/stats.ts` is removed.
