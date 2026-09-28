---
title: "HelperMethodBuilder hand-rolls public_send with an invented 'undefined route helper' ArgumentError"
status: draft
updated: 2026-09-28
rfc: "0141-actionpack-surfaced-deviations"
cluster: null
packages: []
deps: []
deps-rfc: []
est-loc: 50
priority: null
pr: null
claim: null
assignee: null
blocked-by: null
closed-reason: null
---

## Context

Surfaced in trails#8230, which converged polymorphic helper names and routed `route_for`
through `rbFPublicSend`. `HelperMethodBuilder` still hand-rolls Rails' `public_send`:

- `polymorphic_method` ends with `recipient.public_send(method, *args[, options])`
  (`vendor/rails/v8.0.2/actionpack/lib/action_dispatch/routing/polymorphic_routes.rb:239-243`).
  trails (`packages/actionpack/src/action-dispatch/routing/polymorphic-routes.ts:~256-264`) reads
  `target[method]`, raises an invented `ArgumentError("undefined route helper …")`, and then calls
  `helper.call(target, …)`. Rails raises `NoMethodError` from `public_send`.
- `handle_string_call` / `handle_class_call` / `handle_model_call` (`polymorphic_routes.rb:258-289`)
  are `target.public_send(...)`. trails does `(target[m] as …).call(target)` (`:~283`, `:~292`, `:~308`).
  That bypasses the visibility check and reaches a private helper Rails would refuse.

## Acceptance criteria

- All four sites dispatch through `rbFPublicSend(target, method, ...args)`, the port of
  `Kernel#public_send` that `url-for.ts`'s `routeFor` already uses.
- The invented `undefined route helper` `ArgumentError` is removed. A missing helper raises
  `NoMethodError`, and the `polymorphic-routes.test.ts` expectations are updated to match.
