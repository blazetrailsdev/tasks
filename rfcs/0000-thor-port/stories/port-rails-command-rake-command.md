---
title: "Port Rails::Command::RakeCommand so non-Thor namespaces (db:*, app:template) dispatch to Rake tasks"
status: draft
updated: 2026-09-30
rfc: "0000-thor-port"
cluster: null
packages: ["trailties"]
deps:
  [
    "vendor-thor-and-port-command-base-thor-surface",
    "port-rake-dsl-task-manager-for-app-tasks",
    "find-by-namespace-lookup-loads-only-candidates",
  ]
deps-rfc: []
est-loc: 300
priority: 2
pr: null
claim: null
assignee: null
blocked-by: null
closed-reason: null
---

## Context

`Rails::Command.invoke` (`vendor/rails/v8.0.2/railties/lib/rails/command.rb:45-72`) falls back
to `find_by_namespace("rake")` when no Thor command claims the namespace, and
`RakeCommand.perform` (`vendor/rails/v8.0.2/railties/lib/rails/commands/rake/rake_command.rb`, 55 lines) boots `Rake.application`, loads
the app's tasks and invokes the task. In Rails, `bin/rails db:migrate`, `db:*` and
`app:template` all take that path. In trails they are commander subcommands (`packages/trailties/src/commands/db.ts`,
992 lines; `packages/trailties/src/commands/app.ts`), and `invokeRake` (`packages/trailties/src/command.ts:48-61`)
re-enters commander. `port-rake-dsl-task-manager-for-app-tasks` (0142) ports the Rake DSL
this needs.

## Acceptance criteria

- [ ] `RakeCommand` is a `Base` subclass at `commands/rake.ts` with `rake_command.rb`'s members,
      and `invokeRake` dispatches to it.
- [ ] `printing_commands` lists rake tasks with descriptions, as `rake_command.rb` does.
