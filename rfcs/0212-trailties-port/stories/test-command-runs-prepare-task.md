---
title: "TestCommand#perform runs test:prepare"
status: ready
updated: 2026-11-01
rfc: "0212-trailties-port"
cluster: null
packages: []
deps:
  - port-rails-command-rake-command
deps-rfc: []
est-loc: 30
priority: null
pr: null
claim: null
assignee: null
blocked-by: null
closed-reason: null
---

## Context

`Rails::Command::TestCommand#perform` calls `run_prepare_task` guarded by
`EXACT_TEST_ARGUMENT_PATTERN`, with an `UnrecognizedCommandError` rescue
(`vendor/rails/v8.0.2/railties/lib/rails/commands/test/test_command.rb:28-34,70-76`).
`packages/trailties/src/commands/test.ts` holds the constant unread and does not
call the task, because `RakeCommand` is unported (`port-rails-command-rake-command`).

## Acceptance criteria

- `perform` runs `runPrepareTask` unless an exact test argument was given, as Rails does.
- `error.name === "test:prepare"` is swallowed and any other error re-raised.
