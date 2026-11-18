---
title: "autorun's TestContext.testCase augmentation does not reach vitest's re-exported TestContext"
status: draft
updated: 2026-11-18
rfc: "0142-trailties-surfaced-deviations"
cluster: null
packages: []
deps: []
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

`packages/activesupport/lib/testing/autorun.ts` types the per-test `TestCase` as
`declare module "vitest" { interface TestContext { testCase: TestCase } }`. vitest's
`TestContext` is re-exported from `@vitest/runner` (`vitest/dist/index.d.ts`), and an
interface cannot be augmented through a module that only re-exports it, so in an
application (trailmap#159) `beforeEach(async ({ testCase }) => ...)` fails with
`TS2339: Property 'testCase' does not exist on type 'TestContext'`. The value is there
at runtime. Without it a vitest test cannot reach Rails' fixture accessors
(`testCase.rfcs("trailmap")`, test_fixtures.rb's accessor methods) with types.

## Acceptance criteria

- autorun augments `@vitest/runner`'s `TestContext` (or whichever module declares it),
  so `({ testCase })` typechecks in a `trails new` app's test.
- A type test in trails holds it.
