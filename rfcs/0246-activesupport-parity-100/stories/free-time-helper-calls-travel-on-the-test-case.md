---
title: "free-time-helper-calls-travel-on-the-test-case"
status: ready
updated: 2026-11-20
rfc: "0246-activesupport-parity-100"
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

`packages/activesupport/lib/testing/time-helpers.ts` now keeps `@simple_stubs` / `in_block` per receiver, as `vendor/rails/v8.0.2/activesupport/lib/active_support/testing/time_helpers.rb:262-266` does. A free call (`travelTo(...)` inside a Vitest `it` body) has no test-case `self`, so it travels on a module-private `_freeReceiver`, and `afterTeardown` unwinds that receiver as well as `this` (receipted `@noRailsEquivalent` / `@inventedArm` CONVERGEABLE this story). ~54 files import the free functions.

## Acceptance criteria

- Free-function callers call `this.travelTo` etc. on the running test case (autorun's `context.testCase`), or the free exports resolve that test case, so `_freeReceiver` and the extra `travelBack.call(_freeReceiver)` in `afterTeardown` are deleted.
- `afterTeardown` is `travel_back; super` (`time_helpers.rb:69-72`).
