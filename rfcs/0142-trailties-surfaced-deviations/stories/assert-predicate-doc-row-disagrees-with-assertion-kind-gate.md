---
title: "assert-predicate-doc-row-disagrees-with-assertion-kind-gate"
status: draft
updated: 2026-11-08
rfc: "0142-trailties-surfaced-deviations"
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

CONTRIBUTING.md § "Porting a Minitest assertion", row `:48`, ports
`assert_predicate o, :foo?` as `expect(o.isFoo()).toBe(true)`. The assertion-kind
gate disagrees. `scripts/test-compare/assertion-kinds.ts:114-119` maps
`assert_predicate` to the kind `truthy`, and says "`expect(obj.pred).toBeTruthy()`
IS the twin". The same table maps `toBe` to `equal` (`:253`). So a port that
follows the doc row reddens Rails API/Test Comparison's assertion-mismatch
ratchet. trails#9855 hit this: 15 kind mismatches in `mailer-previews.test.ts`,
including the equal-vs-truthy deltas for `assert_predicate last_response, :ok?`.
A reviewer then cited the doc row against the gate-conforming `toBeTruthy()`.

## Acceptance criteria

- CONTRIBUTING.md's `assert_predicate` / `assert_not_predicate` rows and
  `assertion-kinds.ts` name the same default form. Either the doc row says
  `toBeTruthy()` (`toBeRubyTruthy()` where `foo?` returns a value), or the gate
  credits `toBe(true)` / `toBe(false)` as `truthy` / `falsy` for a predicate
  call.
- A `scripts/test-compare` test pins the agreed mapping.
