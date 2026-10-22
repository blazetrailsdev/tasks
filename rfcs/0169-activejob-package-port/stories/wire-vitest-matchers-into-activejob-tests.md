---
title: "Wire @blazetrails/vitest-matchers types into activejob tests"
status: done
updated: 2026-10-22
rfc: "0169-activejob-package-port"
cluster: null
packages: []
deps: []
deps-rfc: []
est-loc: 30
priority: null
pr: trails#9223
claim: "2026-10-22T15:46:39Z"
assignee: "port-activejob-test-helper-test-performed-part-3"
blocked-by: null
closed-reason: null
---

## Context

CONTRIBUTING.md § "Porting a Minitest assertion" maps `assert_predicate o, :foo?` (`minitest/assertions.rb:394`) on a value-returning predicate to `expect(o.foo()).toBeRubyTruthy()`, and `assert x` on a value that can be `0`/`""` to `toBeRubyTruthy()`. Those matchers live in `packages/vitest-matchers/src/index.ts`, and `scripts/test-compare/assertion-kinds.ts:260-261` credits them as `truthy` / `falsy`. But no package lists `@blazetrails/vitest-matchers` as a devDependency, has a tsconfig reference to it, or loads its type augmentation. So in any package test, `expect(x).toBeRubyTruthy()` fails `pnpm build` with TS2551.

trails#9194 hit this in `packages/activejob/src/enqueue-after-transaction-commit.test.ts` and fell back to `toBeTruthy()`. That is correct there only because `successfully_enqueued?` returns a boolean. Upcoming activejob ports (`test_helper_test.rb`, `test_case_test.rb`) assert on value-returning predicates and adapter readers that default to `nil`, so they need the Ruby matchers.

## Acceptance criteria

- [ ] `packages/activejob` lists `@blazetrails/vitest-matchers` as a devDependency, has a tsconfig reference to it, and loads its `Assertion` augmentation, so `toBeRubyTruthy` / `toBeRubyFalsy` / `toEqualRuby` type-check in activejob tests.
- [ ] The `other` vitest project's setup registers the matchers at runtime for activejob (`@blazetrails/vitest-matchers/setup`, aliased in `vitest.config.ts:319`).
- [ ] One activejob test asserting on a value-returning predicate uses `toBeRubyTruthy()` and passes `pnpm build`.
