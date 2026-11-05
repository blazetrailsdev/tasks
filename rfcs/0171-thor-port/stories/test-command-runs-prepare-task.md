---
title: "TestCommand#perform runs test:prepare"
status: done
updated: 2026-11-05
rfc: "0171-thor-port"
cluster: null
packages: []
deps:
  - port-rails-command-rake-command
deps-rfc: []
est-loc: 30
priority: null
pr: trails#9746
claim: "2026-11-05T16:36:28Z"
assignee: "actionmailer-base-types-from-included-modules"
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
