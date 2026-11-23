---
title: "Pin SystemTestCase#urlHelpers against the TestFixtures proxy recursion"
status: draft
updated: 2026-11-23
rfc: "0141-actionpack-surfaced-deviations"
cluster: null
packages: []
deps: []
deps-rfc: []
est-loc: 40
priority: null
pr: null
claim: null
assignee: null
blocked-by: null
closed-reason: null
---

## Context

trails#10662 fixed infinite recursion in `SystemTestCase#urlHelpers`
(`packages/actionpack/lib/action-dispatch/system-test-case.ts:53,143`). `_urlHelpers` was a
`declare` field, so reading it while unset fell into `TestFixtures`' proxy `get` trap
(`packages/activerecord/lib/test-fixtures.ts:490-503`). The trap called `respondToMissing`,
which called `urlHelpers()` again. Rails' version is a plain
`@url_helpers ||=` ivar (`vendor/rails/v8.0.5.2/actionpack/lib/action_dispatch/system_test_case.rb`).
No test pins this. Only the Quickstart job exercised it, and since trails#10662 Quickstart's
`pnpm test` runs only the unit project.

## Acceptance criteria

- A trails-only test (`*.trails.test.ts`) builds a `SystemTestCase` subclass with
  ActiveRecord `TestFixtures` included, then calls a missing name / `respondToMissing`
  with `ActionDispatch.testApp` unset. It asserts no `RangeError`.
- The test fails when `_urlHelpers` is reverted to `declare`.
