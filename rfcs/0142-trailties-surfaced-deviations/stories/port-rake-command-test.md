---
title: "Port railties commands/rake_test.rb (runs multiple tasks, runs task with arguments)"
status: draft
updated: 2026-11-19
rfc: "0142-trailties-surfaced-deviations"
cluster: null
packages: []
deps: []
deps-rfc: []
est-loc: 60
priority: null
pr: null
claim: null
assignee: null
blocked-by: null
closed-reason: null
---

## Context

`railties/test/commands/rake_test.rb` (Rails 8.0.2) has two tests, and
neither is ported: `packages/trailties/test/commands/rake.test.ts` does not
exist, and the only rake-command tests are the trails-only
`rake.trails.test.ts` (trails#10370).

- `rake_test.rb:10` `runs multiple tasks`: `lib/tasks/foo.rake` and
  `bar.rake` each `puts`, and `run_rake_command "foo", "bar"` matches both.
- `rake_test.rb:19` `runs task with arguments`: `greetings:hello[World]`
  prints `Hello, World!`.

## Acceptance criteria

- `packages/trailties/test/commands/rake.test.ts`, `describe("Rails::Command::RakeTest")`
  or the convention name, carries both tests with the Rails names verbatim,
  driving `RakeCommand.perform` against `lib/tasks/*.ts` files in a tmp app.
- `pnpm parity:test` counts both as matched for `rake_test.rb`.
