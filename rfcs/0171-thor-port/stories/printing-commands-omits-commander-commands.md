---
title: "printing-commands-omits-commander-commands"
status: closed
updated: 2026-11-09
rfc: "0171-thor-port"
cluster: null
packages: []
deps: []
deps-rfc: []
est-loc: 60
priority: null
pr: null
claim: "2026-11-03T14:42:08Z"
assignee: "unplaced-rails-classes-get-a-constant-table"
blocked-by: null
closed-reason: "Blocker landed: retire-commander-cli-onto-rails-command-invoke merged (trails#9922, 56d9d124ae). origin/main has no 'commander' in packages/trailties/{package.json,lib}; db/app/new are Command::Base subclasses under lib/commands/{db,app,application.ts}, so printingCommands (lib/command.ts:125) walking subclasses lists them."
---

## Context

`Rails::Command.printing_commands` (`vendor/rails/v8.0.2/railties/lib/rails/command.rb:114-118`) lists every command class. `printingCommands` in `packages/trailties/src/command.ts` walks `subclasses()` the same way, but commands still on commander (`db`, `new`, `app`, reached through `createProgram()` in `findByNamespace`) are not `Base` subclasses, so they are missing from the list. Its one Rails caller, `UnrecognizedCommandError`, is filed as `port-unrecognized-command-error-and-db-system-change`.

## Acceptance criteria

- Every command Rails' `printing_commands` lists appears in `printingCommands`, either through a port onto `Rails::Command::Base` or through `retire-commander-cli-onto-rails-command-invoke`.
