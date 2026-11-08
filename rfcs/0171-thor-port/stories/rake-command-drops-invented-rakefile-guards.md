---
title: "rake-command-drops-invented-rakefile-guards"
status: draft
updated: 2026-11-08
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

`RakeCommand.perform` and `rakeTasks` (`packages/trailties/src/commands/rake.ts:25-36,79-85`) each open with an invented `findRakefileLocation() == null` guard (raise `UnrecognizedCommandError` / answer `[]`). Rails has neither: `vendor/rails/v8.0.2/railties/lib/rails/commands/rake/rake_command.rb:19-29,47-49` goes straight to `with_rake`. Outside an app, `bin.ts` now dispatches as `cli.rb` does (trails#9873) and never reaches rake, so the guards only serve in-app runs with no Rakefile — in practice the trailties test suite, which runs `invoke` from the repo root (`command.trails.test.ts` "hides unused_routes…", `command/base.trails.test.ts` "printing_commands skips hidden_commands", `commands/usage.trails.test.ts`: 5 tests fail with the guards removed).

## Acceptance criteria

- Both guards and their `@inventedArm if` receipts are deleted; `perform` / `rake_tasks` match rake_command.rb line for line.
- The tests that relied on them run under a directory with a Rakefile (a tmp app or fixture), not the repo root.
