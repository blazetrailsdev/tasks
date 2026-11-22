---
title: "trailties: engine.test.ts describes name RailtiesTest::EngineTest, the Rails class path"
status: draft
updated: 2026-11-22
rfc: "0142-trailties-surfaced-deviations"
cluster: null
packages: []
deps: []
deps-rfc: []
est-loc: 10
priority: null
pr: null
claim: null
assignee: null
blocked-by: null
closed-reason: null
---

## Context

Rails nests the engine tests in a module: `module RailtiesTest` / `class EngineTest < ActiveSupport::TestCase`
(`vendor/rails/v8.0.2/railties/test/railties/engine_test.rb:7-8`), so the class path is
`RailtiesTest::EngineTest`. trails#10522 renamed the port's describes from
`describe("RailtiesTest::EngineTest")` to `describe("EngineTest")`
(`packages/trailties/test/trailties/engine.test.ts:32,81,530`), matching test-compare's old
misread, which dropped an enclosing `module`. trails#10536 fixed the extractor
(`rubyClassPath`), so the qualified describe matches again.

## Acceptance criteria

- [ ] The three describes in `packages/trailties/test/trailties/engine.test.ts` are `describe("RailtiesTest::EngineTest")`, as the Rails class path is.
- [ ] `pnpm parity:test --package trailties` reports no new wrong-describe or missing rows for `railties/engine_test.rb`.
