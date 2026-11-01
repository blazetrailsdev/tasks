---
title: "printing-commands-omits-commander-commands"
status: draft
updated: 2026-11-01
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

`Rails::Command.printing_commands` (`vendor/rails/v8.0.2/railties/lib/rails/command.rb:114-118`) lists every command class. `printingCommands` in `packages/trailties/src/command.ts` walks `subclasses()` the same way, but commands still on commander (`db`, `new`, `app`, reached through `createProgram()` in `findByNamespace`) are not `Base` subclasses, so they are missing from the list. Its one Rails caller, `UnrecognizedCommandError`, is filed as `port-unrecognized-command-error-and-db-system-change`.

## Acceptance criteria

- Every command Rails' `printing_commands` lists appears in `printingCommands`, either through a port onto `Rails::Command::Base` or through `retire-commander-cli-onto-rails-command-invoke`.
