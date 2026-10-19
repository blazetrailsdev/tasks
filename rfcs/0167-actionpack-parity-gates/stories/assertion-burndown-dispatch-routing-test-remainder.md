---
title: "assertion-burndown-dispatch-routing-test-remainder"
status: done
updated: 2026-10-18
rfc: "0167-actionpack-parity-gates"
cluster: null
packages: []
deps: []
deps-rfc: []
est-loc: 450
priority: null
pr: trails#9040
claim: "2026-10-18T19:44:54Z"
assignee: "authenticate-by-found-arm-is-systematically-slower-than-not-found"
blocked-by: null
closed-reason: null
---

## Context

Remainder of `assertion-burndown-dispatch-routing-test` (the bundle PR ported 23 placeholder bodies and converged `Mapper#scope` to Rails' `scope(*args)`, `vendor/rails/v8.0.2/actionpack/lib/action_dispatch/routing/mapper.rb:857-861`). `pnpm parity:test:assertions` still reports for `vendor/rails/v8.0.2/actionpack/test/dispatch/routing_test.rb` → `packages/actionpack/src/action-dispatch/dispatch/routing.test.ts`: assert 44, kind 57, value 18.

Most remaining tests in `TestRoutingMapper` are placeholders built on `new RouteSet()` + `recognizePath` rather than Rails' `draw` + `get` + `@response.body`. Port each as the converged ones do (the file's `draw()` helper, `t.get`, `t.response.body`, `t.<name>Path`).

This story covers the resource and namespace tests, from "session singleton resource" through "symbol scope" in file order. The largest are: projects people (Rails 12 / trails 2), session singleton resource for api app (9/5), projects for api app (10/4), path names (10/4), resource routes with only and except (10/6), resource constraints (9/2), forum products (8/2), optional scoped root hierarchy (8/3). It also covers the value-only rows (member on resource, openid, websocket, local, module scope, namespace containing numbers, pagemarks, replies, update person route).

The scope-option tests from "url generator for generic route" onward are `assertion-burndown-dispatch-routing-test-scope-options`.

## Acceptance criteria

- Each mismatch above that is a real divergence is converged by porting the Rails body.
- `pnpm parity:test:assertions` shows no divergence rows for these tests, and the actiondispatch mark in `scripts/test-compare/assertion-mismatch-mark.json` is tightened.
