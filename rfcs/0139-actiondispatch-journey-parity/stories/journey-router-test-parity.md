---
title: "Journey router test parity: move 25 misplaced tests and port 10 absent"
status: done
updated: 2026-09-08
rfc: "0139-actiondispatch-journey-parity"
cluster: null
packages: ["actionpack"]
deps: ["journey-test-names-to-rails-def-test-form"]
deps-rfc: []
est-loc: 450
priority: null
pr: 7610
claim: "2026-09-08T13:31:47Z"
assignee: "journey-router-test-parity"
blocked-by: null
closed-reason: null
---

## Context

`vendor/rails/actionpack/test/journey/router_test.rb` has 35 tests; the
convention file `packages/actionpack/src/action-dispatch/journey/router.test.ts`
credits 0 of them and holds 14 trails-only tests.

The 35 split cleanly:

- **25 are ported already, in the wrong file.** They live in
  `packages/actionpack/src/action-dispatch/dispatch/routing.test.ts` and the
  comparer reports them as misplaced against `journey/router.test.ts` — `dashes`,
  `unicode`, `regexp first precedence`, `required parts verified are anchored`,
  `required parts are verified when building`, `only required parts are
verified`, `knows what parts are missing from named route`, `does not include
missing keys message`, `x cascade`, `clear trailing slash from script name on
root unanchored routes`, `defaults merge correctly`, `recognize with unbound
regexp`, `bound regexp keeps path info`, `path not found`, `required part in
recall`, `splat in recall`, `recall should be used when scoring`, `nil path
parts are ignored`, `generate slash`, `generate id`, `generate escapes`,
  `generate with name`, `recognize cares about get verbs`, `recognize cares
about post verbs`, `multi verb recognition`.
- **10 are genuinely absent** — `generate escapes with namespaced controller`,
  `generate extra params`, `generate missing keys no matches different format
keys`, `generate uses recall if needed`, `namespaced controller`, `recognize
literal`, `recognize head route`, `recognize head request as get route`,
  `eager load with routes`, `eager load without routes`.

This is the largest story in the RFC. If the move and the port together exceed
the LOC ceiling, ship the move first and register the port as a sibling story
rather than fanning out a second PR yourself.

## Acceptance criteria

- The 25 misplaced tests move from `dispatch/routing.test.ts` to
  `journey/router.test.ts` verbatim — same name, same body, same order relative
  to the Ruby.
- The 10 absent tests are ported from `router_test.rb`, read whole first.
- The 14 trails-only tests in `journey/router.test.ts` move to a
  `journey/router.trails.test.ts` sibling. None is deleted.
- `pnpm parity:test --package actiondispatch` reports `journey/router_test.rb`
  at 35/35 with 0 misplaced and 0 extra, and `dispatch/routing_test.rb`'s own
  matched count does not fall.
- Assertion mismatches revealed on these 35 pairs are converged, not marked.
