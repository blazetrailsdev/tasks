---
title: "trailties-test-minitest-reporters-and-server-restart"
status: ready
updated: 2026-11-24
rfc: "0248-trailties-parity-100"
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

Split from trailties-test-test-runner-plugin-and-parser and trailties-test-server-and-rackup.

1. `vendor/rails/v8.0.5.2/railties/test/minitest/rails_plugin_test.rb` — 4 Miss: "replaces
   Minitest::SummaryReporter reporter", "replaces Minitest::ProgressReporter reporter",
   "keeps non-default reporters", "does not add reporters when not replacing reporters".
   They need `Minitest.reporter` (a `CompositeReporter`), `SummaryReporter`,
   `ProgressReporter`, `Reporter`, and `Minitest::SuppressedSummaryReporter` /
   `ProfileReporter` (`railties/lib/minitest/rails_plugin.rb:21-62`) plus the reporter arms of
   `plugin_rails_init` (`rails_plugin.rb:125-142`). None exist: trails'
   `packages/trailties/lib/minitest/trails-plugin.ts` ports only the backtrace arm, and
   `@blazetrails/activesupport/testing/assertions` exposes `Minitest` with no reporter.
2. `vendor/rails/v8.0.5.2/railties/test/application/server_test.rb:19-40` "restart rails server
   with custom pid file path" — `trails restart` touches `tmp/restart.txt`
   (`packages/trailties/lib/commands/restart.ts`) but nothing in rackup's node handler watches it
   and prints "Restarting" (Puma's `tmp_restart` plugin in Rails).

## Acceptance criteria

- [ ] The 4 reporter tests ported into `test/minitest/trails-plugin.test.ts` and passing.
- [ ] "restart trails server with custom pid file path" ported into `test/application/server.test.ts`.
