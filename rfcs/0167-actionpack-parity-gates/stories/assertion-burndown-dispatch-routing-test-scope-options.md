---
title: "assertion-burndown-dispatch-routing-test-scope-options"
status: draft
updated: 2026-10-18
rfc: "0167-actionpack-parity-gates"
cluster: null
packages: []
deps: []
deps-rfc: []
est-loc: 500
priority: null
pr: null
claim: null
assignee: null
blocked-by: null
closed-reason: null
---

## Context

Split from `assertion-burndown-dispatch-routing-test-remainder`.
`pnpm parity:test --cached --assertions --missing --package actiondispatch`
(2026-10-18) reports these rows for
`vendor/rails/v8.0.2/actionpack/test/dispatch/routing_test.rb` →
`packages/actionpack/src/action-dispatch/dispatch/routing.test.ts`, from
"url generator for generic route" to the end of `TestRoutingMapper` in file order:

- shallow nested resources (Rails 50 / trails 5), shallow nested resources inside resource (12/3)
- custom resource routes are scoped (15/1), non greedy regexp (12/1)
- constraints are merged from scope (16/2), resource / nested resource constraints, constraints block not carried to following routes
- only / except should be read from scope (12/4 each), only / except option should override scope / should not inherit
- resource / resources merges options from scope (and the hash form)
- resources are not pluralized (11/8), singleton resources are not singularized (9/4), resources path can be a symbol (6/2)
- url generator for (namespaced) generic route, optional prefix dynamic segment, optional suffix static and dynamic segment
- paths with partial dynamic segments are recognised (16/6, and 2/3), trailing slash, invalid route name raises error, URL helpers raise message with mixed parameters when generation fails, route defined in resources scope level, block redirect commits flash

These are placeholders built on `new RouteSet()` + `recognizePath`. Port each
Rails body with the file's `draw()` helper, `t.get`, `t.response.body` and
`t.<name>Path`, the way the converged tests already are.

## Acceptance criteria

- Each row above that is a real divergence is converged by porting the Rails body.
- `pnpm parity:test:assertions` shows no divergence rows for these tests, and the
  actiondispatch mark in `scripts/test-compare/assertion-mismatch-mark.json` is tightened.
