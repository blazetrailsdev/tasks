---
title: "assertion-burndown-dispatch-routing-test-remainder"
status: ready
updated: 2026-10-18
rfc: "0167-actionpack-parity-gates"
cluster: null
packages: []
deps: []
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

Remainder of `assertion-burndown-dispatch-routing-test` (the bundle PR ported 23 placeholder bodies and converged `Mapper#scope` to Rails' `scope(*args)`, `vendor/rails/v8.0.2/actionpack/lib/action_dispatch/routing/mapper.rb:857-861`). `pnpm parity:test:assertions` still reports for `vendor/rails/v8.0.2/actionpack/test/dispatch/routing_test.rb` → `packages/actionpack/src/action-dispatch/dispatch/routing.test.ts`: assert 44, kind 57, value 18.

Most remaining tests in `TestRoutingMapper` are placeholders built on `new RouteSet()` + `recognizePath` rather than Rails' `draw` + `get` + `@response.body`. Port each as the converged ones do (the file's `draw()` helper, `t.get`, `t.response.body`, `t.<name>Path`). Largest: shallow nested resources (50 vs 5), constraints are merged from scope, custom resource routes are scoped, only/except should be read from scope, non greedy regexp, resources are not pluralized. Value-only rows: member on resource, openid, websocket, local, module scope, namespace containing numbers, pagemarks, replies, update person route, etc.

## Acceptance criteria

- Each remaining mismatch in routing_test.rb that is a real divergence is converged by porting the Rails body.
- `pnpm parity:test:assertions` shows 0 divergence rows for the file, and the actiondispatch mark in `scripts/test-compare/assertion-mismatch-mark.json` is tightened.
