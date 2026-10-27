---
title: "autorun's vitest bridge sends Minitest's full SETUP_METHODS / TEARDOWN_METHODS"
status: draft
updated: 2026-10-27
rfc: "0206-minitest-port-and-assertions-to-expect"
cluster: null
packages: []
deps: []
deps-rfc: []
est-loc: 80
priority: null
pr: null
claim: null
assignee: null
blocked-by: null
closed-reason: null
---

## Context

`Minitest::Test#run` (`vendor/minitest/v5.27.0/lib/minitest/test.rb:21-23`, `:91-93`) sends every hook in `SETUP_METHODS` (`before_setup setup after_setup`) before the test body, then every hook in `TEARDOWN_METHODS`. trails' `Test#run` (`packages/activesupport/src/testing/assertions.ts:64-66`, `:132-134`) does the same.

The vitest bridge in `packages/activesupport/src/testing/autorun.ts` does not. Its `beforeEach` calls only `testCase.beforeSetup()`, and its `afterEach` calls only `afterTeardown()`, so a ported class's instance `setup` / `teardown` never runs. Ports work around this by hand. For example, trails#9379 adds `beforeEach(({ testCase: t }) => t.setup())` to three describes in `packages/actioncable/src/channel/test-case.test.ts`.

## Acceptance criteria

- [ ] `autorun.ts`'s `beforeEach` sends each of `Test.SETUP_METHODS` in order, and its `afterEach` sends each of `Test.TEARDOWN_METHODS`.
- [ ] The hand-written `beforeEach(... t.setup())` lines in `actioncable/src/channel/test-case.test.ts` are removed, and those tests still pass.
- [ ] A regression test fails on the current bridge: a TestCase subclass with an instance `setup()` / `teardown()` sees both run.
