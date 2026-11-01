---
title: "Feed TestUnitReporter from Vitest and print bin/trails rerun snippets"
status: ready
updated: 2026-11-01
rfc: "0212-trailties-port"
cluster: tt-surface
packages: ["trailties"]
deps: []
deps-rfc: []
est-loc: 150
priority: null
pr: null
claim: null
assignee: null
blocked-by: null
closed-reason: null
---

## Context

Replaces `test-unit-reporter-wired-to-the-run`. RFC 0212 open question 1 settled that `trails test` hands off to Vitest (trails#9567), and no Minitest package exists, so `Rails::TestUnitReporter < Minitest::StatisticsReporter` (`vendor/rails/v8.0.2/railties/lib/rails/test_unit/reporter.rb:7`) has no superclass to extend here. `packages/trailties/src/test-unit/reporter.ts` is attached to no run, and `trails test` prints Vitest's reporter, so rerun snippets never appear. Its `executable` default is `bin/rails test`, while generated apps ship `bin/trails`.

## Acceptance criteria

- A Vitest reporter adapter feeds `TestUnitReporter` its results on a `trails test` run.
- A failing `trails test` prints `bin/trails test <path>:<line>` rerun snippets.
- The missing `StatisticsReporter` superclass carries a receipt citing the Vitest ruling.
