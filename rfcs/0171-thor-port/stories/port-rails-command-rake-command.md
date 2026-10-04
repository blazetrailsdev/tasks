---
title: "Port Rails::Command::RakeCommand so non-Thor namespaces (db:*, app:template) dispatch to Rake tasks"
status: ready
updated: 2026-09-30
rfc: "0171-thor-port"
cluster: null
packages: ["trailties"]
deps:
  [
    "vendor-thor-and-port-command-base-thor-surface",
    "port-rake-dsl-task-manager-for-app-tasks",
    "find-by-namespace-lookup-loads-only-candidates",
    "thor-cli-names-are-kebab-case-accept-snake-case-input",
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

RFC 0171 decision 6 ("Command and generator names are kebab-case on the command line", `thor-cli-names-are-kebab-case-accept-snake-case-input`) folds `_` into `-` for Thor command and namespace lookup only. A Rake task is not a Thor command, so the fold must not reach the Rake fallback: `Rails::Command.invoke` (`command.rb:56-69`) hands `full_namespace` to `invoke_rake` as the user typed it, and an underscored task name such as `active_storage:install` must arrive unchanged.

## Acceptance criteria

- [ ] `RakeCommand` is a `Base` subclass at `commands/rake.ts` with `rake_command.rb`'s members,
      and `invokeRake` dispatches to it.
- [ ] `printing_commands` lists rake tasks with descriptions, as `rake_command.rb` does.
- [ ] A namespace no Thor command claims reaches Rake with the user's spelling unchanged. A test covers an underscored task name passing through to Rake (RFC 0171 decision 6).
