---
title: "rack-builder-use-calls-a-plain-function-middleware-instead-of-new"
status: draft
updated: 2026-10-17
rfc: "0141-actionpack-surfaced-deviations"
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

Rack's `Builder#use` (`vendor/rack/v3.1.14/lib/rack/builder.rb:159-165`) always pushes
`proc { |app| middleware.new(app, *args, &block) }`. trails' `Builder#use`
(`packages/rack/src/builder.ts`) adds an arm Rack does not have: when `middleware` is a
function without `prototype.call` it is called as a plain factory, `middleware(app, ...args)`,
instead of being constructed. The arm is unreceipted.

## Acceptance criteria

- `use` builds every middleware with `new middleware(app, ...args, block)`, as `builder.rb:164`.
- Callers and tests that pass a plain factory function are converged to a class.
- `builder.test.ts` passes.
