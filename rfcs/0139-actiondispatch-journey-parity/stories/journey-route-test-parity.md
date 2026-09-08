---
title: "Journey route test parity: credit the convention copy and delete the duplicate"
status: done
updated: 2026-09-08
rfc: "0139-actiondispatch-journey-parity"
cluster: null
packages: ["actionpack"]
deps: ["journey-test-names-to-rails-def-test-form"]
deps-rfc: []
est-loc: 200
priority: null
pr: 7609
claim: "2026-09-08T13:01:45Z"
assignee: "journey-path-pattern-test-parity"
blocked-by: null
closed-reason: null
---

## Context

`vendor/rails/actionpack/test/journey/route_test.rb` has 11 tests, and trails
has them **twice**: under the `test_*` spelling in the convention file
`packages/actionpack/src/action-dispatch/journey/route.test.ts`, and again in
`packages/actionpack/src/action-dispatch/dispatch/routing.test.ts`, where the
comparer reports all 11 as misplaced — `initialize`, `route adds itself as
memo`, `path requirements override defaults`, `ip address`, `default ip`,
`format with star`, `connects all match`, `extras are not included if optional`,
`extras are not included if optional with parameter`, `extras are not included
if optional parameter is nil`, `score`.

`journey-test-names-to-rails-def-test-form` re-spells the convention copy, which
credits all 11. This story removes the duplicate that is then redundant, and
moves the 6 trails-only tests out.

Compare the two copies before deleting: if the `dispatch/routing.test.ts` copy
asserts something the convention copy does not, that rigour moves into the
convention copy or its `.trails.test.ts` sibling. Do not delete coverage to make
the misplaced count fall.

## Acceptance criteria

- The 11 duplicated tests are gone from `dispatch/routing.test.ts`, with any
  assertion the convention copy lacked folded in first.
- The 6 trails-only tests in `journey/route.test.ts` move to a
  `journey/route.trails.test.ts` sibling.
- `pnpm parity:test --package actiondispatch` reports `journey/route_test.rb` at
  11/11, 0 misplaced, 0 extra.
