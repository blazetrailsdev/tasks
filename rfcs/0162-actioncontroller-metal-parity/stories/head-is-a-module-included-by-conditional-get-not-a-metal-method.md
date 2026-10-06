---
title: "ActionController::Head is a module included by ConditionalGet and friends, not a Metal method"
status: done
updated: 2026-10-06
rfc: "0162-actioncontroller-metal-parity"
cluster: null
packages: []
deps: []
deps-rfc: []
est-loc: 200
priority: null
pr: trails#8578
claim: "2026-10-06T14:39:43Z"
assignee: "head-is-a-module-included-by-conditional-get-not-a-metal-method"
blocked-by: null
closed-reason: null
---

## Context

Surfaced in review of trails#8507. Rails' `ActionController::Head` is a module
(`vendor/rails/v8.0.2/actionpack/lib/action_controller/metal/head.rb`), and
`ConditionalGet` does `include Head`
(`vendor/rails/v8.0.2/actionpack/lib/action_controller/metal/conditional_get.rb:12`),
as do `Rendering` and others. `ActionController::Metal` itself does not define
`head`.

trails has no `Head` module object. `packages/actionpack/src/action-controller/metal/head.ts`
exports two loose functions (`includeContent`, `headResponse`), and `head` is a
method on the `Metal` class body (`packages/actionpack/src/action-controller/metal.ts`,
`head(status, options)`), so every bare `Metal` subclass answers `head` where Rails'
does not. The `ConditionalGet` Concern module added in trails#8507
(`metal/conditional-get.ts`) therefore has no `include(mod, Head)` line.

## Acceptance criteria

- `Head` is a module in `metal/head.ts` carrying `head` and the private
  `include_content?` with Rails' bodies (`head.rb:23-67`).
- `Metal` no longer defines `head`; `ConditionalGet` (and every other Rails module
  that does `include Head`) includes it, in Rails' position.
- Tests that call `head` on a bare `Metal` subclass include the module the Rails
  test includes.
