---
title: "Journey routes test parity"
status: done
updated: 2026-09-08
rfc: "0139-actiondispatch-journey-parity"
cluster: null
packages: ["actionpack"]
deps: ["journey-test-names-to-rails-def-test-form"]
deps-rfc: []
est-loc: 150
priority: null
pr: 7611
claim: "2026-09-08T14:01:49Z"
assignee: "journey-routes-test-parity"
blocked-by: null
closed-reason: null
---

## Context

`vendor/rails/actionpack/test/journey/routes_test.rb` has 6 tests — `ast`,
`simulator changes`, `partition route`, `custom anchored not partition route`,
`first name wins`, and one already credited. Three are reached by the
re-spelling story; two remain absent. The convention file
`packages/actionpack/src/action-dispatch/journey/routes.test.ts` holds 4
trails-only tests.

## Acceptance criteria

- The absent tests are ported from `routes_test.rb`, read whole first.
- The 4 trails-only tests move to a `journey/routes.trails.test.ts` sibling.
- `pnpm parity:test --package actiondispatch` reports `journey/routes_test.rb`
  at 6/6, 0 extra.
