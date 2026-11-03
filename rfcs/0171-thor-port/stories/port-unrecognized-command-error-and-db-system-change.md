---
title: "port-unrecognized-command-error-and-db-system-change"
status: done
updated: 2026-11-03
rfc: "0171-thor-port"
cluster: null
packages: []
deps: []
deps-rfc: []
est-loc: 120
priority: null
pr: trails#9669
claim: "2026-11-03T14:42:08Z"
assignee: "unplaced-rails-classes-get-a-constant-table"
blocked-by: null
closed-reason: null
---

## Context

`UnrecognizedCommandError` is ported (`packages/trailties/src/command.ts:47`) and raised from `commands/rake.ts:34,48`. What remains is `Rails::Command::Db::System::ChangeCommand` (`vendor/rails/v8.0.2/railties/lib/rails/commands/db/system/change/change_command.rb`), which is unported: `packages/trailties/src/command/base.test.ts:26-34` defines a local `ChangeCommand` class to stand in for it.

## Acceptance criteria

- [ ] `Db::System::ChangeCommand` is ported onto `Trails::Command::Base` at the mirrored path, with its Rails test (`vendor/rails/v8.0.2/railties/test/commands/db_system_change_test.rb`).
- [ ] The local class in `command/base.test.ts` is replaced by the real one.
