---
title: "trailties-test-unit-line-filtering"
status: ready
updated: 2026-11-01
rfc: "0212-trailties-port"
cluster: null
packages: []
deps:
  - trailties-test-unit-runner-reporter-and-test-command
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

`vendor/rails/v8.0.2/railties/lib/rails/test_unit/line_filtering.rb:6-10` wraps
`run` and calls `Rails::TestUnit::Runner.compose_filter`
(`vendor/rails/v8.0.2/railties/lib/rails/test_unit/runner.rb:81-89`), and its
`super` is `Minitest::Runnable.run`. Neither `Runner` nor a Minitest `Runnable`
is ported, so it could not land with `TestParser`
(`packages/trailties/src/test-unit/test-parser.ts`).
`test_unit/railtie.rb` is what includes it, tracked by
`test-unit-railtie-line-filtering-and-rake-tasks`.

## Acceptance criteria

- `packages/trailties/src/test-unit/line-filtering.ts` ports `LineFiltering#run`
  over the ported `Runner.composeFilter`.
- `CompositeFilter`'s line lookup reaches `TestParser.definitionFor`.

- `test-parser.ts` statically imports `typescript/unstable/*`, and `typescript` is an
  optional peer of trailties. Keep it off any load path that runs without
  `typescript` installed.
