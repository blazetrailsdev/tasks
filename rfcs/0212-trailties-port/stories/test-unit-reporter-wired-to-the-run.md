---
title: "TestUnitReporter extends StatisticsReporter and reports trails test runs"
status: closed
updated: 2026-11-01
rfc: "0212-trailties-port"
cluster: null
packages: []
deps: []
deps-rfc: []
est-loc: 150
priority: null
pr: null
claim: null
assignee: null
blocked-by: null
closed-reason: "Superclass arm is impossible: no Minitest package exists and trails test runs Vitest (RFC open question 1, trails#9567). Replaced by test-unit-reporter-fed-by-vitest, which also targets bin/trails."
---

## Context

`Rails::TestUnitReporter < Minitest::StatisticsReporter`
(`vendor/rails/v8.0.2/railties/lib/rails/test_unit/reporter.rb:7`). In
`packages/trailties/src/test-unit/reporter.ts` the class has no superclass, owns
`io` / `options` / `results`, omits `count` / `assertions`, and is not attached to
any run: `trails test` prints Vitest's reporter, so rerun snippets never appear.

## Acceptance criteria

- The class extends the ported `StatisticsReporter`, or a Vitest reporter adapter feeds it results.
- A failing `trails test` prints `bin/rails test <path>:<line>` rerun snippets.
