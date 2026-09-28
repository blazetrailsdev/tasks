---
title: "Converge ActionController::Base's 18 call baseline rows"
status: draft
updated: 2026-09-27
rfc: "0162-actioncontroller-metal-parity"
cluster: null
packages: ["actionpack"]
deps:
  [
    "action-controller-config-seats-onto-activesupport-primitives",
    "restructure-http-authentication-into-basic-digest-and-token",
  ]
deps-rfc: []
est-loc: 350
priority: null
pr: null
claim: null
assignee: null
blocked-by: null
closed-reason: null
---

## Context

`scripts/api-compare/call-mismatches-exclude/actioncontroller/base.json` holds 18
rows, the largest shard in actionpack. Each records a trails method in
`packages/actionpack/src/action-controller/base.ts` that omits a call its Rails
counterpart makes, or passes different arguments. Rails' `ActionController::Base`
(`vendor/rails/v8.0.2/actionpack/lib/action_controller/base.rb`) is almost only a
`MODULES` list, so most of these rows are methods whose Rails body lives in one
of the included modules and that trails re-implemented on `Base`.

## Acceptance criteria

- Each row is resolved by moving the method to the file mirroring the module
  that defines it in Rails, with the Rails body, or by making the `Base` body
  call what Rails calls. Each converged row is deleted by hand and the mark
  tightened with `pnpm parity:api:calls:tighten actioncontroller/base.json`.
- `base.json` is empty.
- `pnpm parity:api:extra --package actioncontroller` reports no new moved name
  on `base.ts`.
