---
title: "test-help's TestCase types omit the TestFixtures class attributes, so use_transactional_tests = false does not typecheck"
status: ready
updated: 2026-11-17
rfc: "0142-trailties-surfaced-deviations"
cluster: null
packages: ["trailties"]
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

Found by trailmap#155. `trailties/lib/test-help.ts` includes
`ActiveRecord::TestFixtures` into `ActiveSupport::TestCase` and merges a
namespace onto `TestCase` so the added class methods typecheck (`fixtures`,
`setFixtureClass`, `setupFixtureAccessors`, `usesTransaction`,
`isUsesTransaction`). It leaves out the class attributes the same include
defines, `useTransactionalTests` first among them
(`test-fixtures.ts`: `classAttribute.call(this, "useTransactionalTests", { default: true })`).

So Rails' `self.use_transactional_tests = false`, which an application writes
on any test class that owns a database of its own, works at runtime and fails
`tsc` with TS2551 ("Property 'useTransactionalTests' does not exist on type
'typeof TestCase'"). trailmap casts in one place,
`test/support/transactional-tests.ts`, to get past it.

## Acceptance criteria

- test-help's `TestCase` augmentation declares the `TestFixtures` class
  attributes (`useTransactionalTests`, `useInstantiatedFixtures`,
  `preLoadedFixtures`, `fixturePaths`, `fixtureSetNames`, …) with their types,
  readable and assignable on `TestCase` and its subclasses.
- A trailties test assigns `useTransactionalTests = false` on a subclass under
  `tsc` and asserts the fixture transaction is skipped for it.
- trailmap's `withoutTransactionalTests` cast is removed after the re-vendor.
