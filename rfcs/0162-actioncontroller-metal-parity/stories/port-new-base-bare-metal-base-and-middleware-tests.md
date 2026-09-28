---
title: "Port new_base bare_metal, base and middleware tests"
status: draft
updated: 2026-09-27
rfc: "0162-actioncontroller-metal-parity"
cluster: null
packages: ["actionpack"]
deps:
  [
    "port-actionpack-abstract-unit-test-support",
    "metal-and-abstract-base-missing-methods",
    "action-controller-config-seats-onto-activesupport-primitives",
  ]
deps-rfc: []
est-loc: 400
priority: null
pr: null
claim: null
assignee: null
blocked-by: null
closed-reason: null
---

## Context

Three files under `vendor/rails/v8.0.2/actionpack/test/controller/new_base/`
that test `ActionController::Metal` and `Base` rather than rendering:

- `bare_metal_test.rb` (246 lines, 22): `BareTest` (`:27`, 6), `BareEmptyTest`
  (`:102`, 1), `HeadTest` (`:155`, 14 — `head` with every status and the
  no-content arms), `BareControllerTest` (`:240`, 1). Absent in trails.
- `base_test.rb` (131 lines, 13): `BaseTest < Rack::TestCase` (`:49`). Absent.
- `middleware_test.rb` (4): matched by name, but the tests sit in
  `packages/actionpack/src/action-controller/new-base/middleware.test.ts`,
  outside the convention path `controller/new-base/middleware.test.ts`.
  `middleware_stack` is the class attribute
  `action-controller-config-seats-onto-activesupport-primitives` converges.

## Acceptance criteria

- `controller/new-base/bare-metal.test.ts` and `base.test.ts` port every test in
  Rails order; `new-base/middleware.test.ts` moves to the convention path.
- All three report complete in `pnpm parity:test --package actioncontroller`.
