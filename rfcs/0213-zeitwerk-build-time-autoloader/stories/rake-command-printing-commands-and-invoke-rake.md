---
title: "rake-command-printing-commands-and-invoke-rake"
status: claimed
updated: 2026-11-02
rfc: "0213-zeitwerk-build-time-autoloader"
cluster: null
packages: []
deps: []
deps-rfc: []
est-loc: null
priority: null
pr: null
claim: "2026-11-02T17:56:45Z"
assignee: "rake-command-printing-commands-and-invoke-rake"
blocked-by: null
closed-reason: null
---

## Context

`packages/trailties/src/commands/rake.ts` ports `RakeCommand#perform` and `with_rake` only (`rails/commands/rake/rake_command.rb`). `printing_commands` and `rake_tasks` are not ported, since `Base.printingCommands` is sync and `with_rake` is async, so `zeitwerk:check` is missing from `trails --help`. `packages/trailties/src/tasks.ts` loads only `zeitwerk` of the `rails/tasks.rb` list. `invokeRake` in `packages/trailties/src/command.ts` still tries commander first and reaches `RakeCommand` only with a Rakefile present.

## Acceptance criteria

- `RakeCommand.printingCommands` is ported and rake tasks appear in help.
- `invoke_rake` converges on `find_by_namespace("rake").perform`, including the `--describe` help arm.
