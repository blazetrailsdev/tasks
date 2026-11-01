---
title: "port-unrecognized-command-error-and-db-system-change"
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

`Rails::Command::UnrecognizedCommandError` (`vendor/rails/v8.0.2/railties/lib/rails/command.rb:36-38`) is the only Rails caller of `printing_commands` (`command.rb:114-118`). `printingCommands` is ported in `packages/trailties/src/command.ts` and has no shipped caller. `Rails::Command::Db::System::ChangeCommand` (`rails/commands/db/system/change/change_command.rb`) is also unported; `command/base.test.ts` stands in a local class for it.

## Acceptance criteria

- `UnrecognizedCommandError` is ported and raised where `command.rb` raises it, with its did-you-mean text over `printingCommands`.
- `ChangeCommand` is ported and the local class in `base.test.ts` is replaced by it.
