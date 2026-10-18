---
title: "assertion-burndown-dispatch-routing-test-scope-tail"
status: done
updated: 2026-10-18
rfc: "0167-actionpack-parity-gates"
cluster: null
packages: []
deps: []
deps-rfc: []
est-loc: null
priority: null
pr: trails#9044
claim: "2026-10-18T21:14:52Z"
assignee: "assertion-burndown-dispatch-routing-test-scope-tail"
blocked-by: null
closed-reason: null
---

## Context

Remainder of `assertion-burndown-dispatch-routing-test-scope-options`, cut to fit the PR LOC ceiling.
`pnpm parity:test --assertions --missing --package actiondispatch` still reports these rows for
`vendor/rails/v8.0.2/actionpack/test/dispatch/routing_test.rb` →
`packages/actionpack/src/action-dispatch/dispatch/routing.test.ts`:

- shallow nested resources (`routing_test.rb:2158`, Rails 50 / trails 5)
- custom resource routes are scoped (`:2509`, 15/1)
- constraints are merged from scope (`:2737`, 16/2)
- resources are not pluralized (`:3068`, 11/8)
- URL helpers raise message with mixed parameters when generation fails (`:4966`, 4/1; mind the
  `null`-positional ruling in `packages/actionpack/CLAUDE.md`)
- paths with partial dynamic segments are recognised (`:5088` 16/6 and `:5229` 2/3)
- block redirect commits flash (`:5289`)

These are placeholders built on `new RouteSet()` + `recognizePath`. Port each Rails body with the
file's `draw()` helper, `t.get`, `t.response.body`, `t.<name>Path`, and
`assertRaises([NoMethodError], {}, () => rbFSend(t, "helperPath"))` for Rails'
`assert_raise(NoMethodError) { helper_path }`, the way the converged TestRoutingMapper tests are.

## Acceptance criteria

- Each row above is converged by porting the Rails body.
- The actiondispatch mark in `scripts/test-compare/assertion-mismatch-mark.json` is tightened.
