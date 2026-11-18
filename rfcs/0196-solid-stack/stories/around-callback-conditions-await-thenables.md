---
title: "Around callback conditions await thenables and use Ruby truthiness (CallbackSequence#skip?)"
status: ready
updated: 2026-11-18
rfc: "0196-solid-stack"
cluster: null
packages: []
deps: []
deps-rfc: []
est-loc: 60
priority: null
pr: null
claim: null
assignee: null
blocked-by: null
closed-reason: null
---

## Context

trails#10273 made `Filters::Before#call` and `Filters::After#call`
(`packages/activesupport/lib/callbacks.ts`) await a condition that answers a
thenable, mirroring `user_conditions.all?`
(`vendor/rails/v8.0.2/activesupport/lib/active_support/callbacks.rb:177,206`).
`Around` conditions were left synchronous: `CallbackSequence#isSkip`
(`callbacks.ts`, `!this.userConditions.every((c) => c(arg.target, arg.value))`)
and `Around.build`'s `Value.check` treat a returned Promise as truthy, so an
async `if:` on an around callback always runs it, and an async `unless:` always skips it. They also read results with JS
truthiness (`0` / `""` falsy) where Ruby's `all?` treats them as true.

Rails: `CallbackSequence#skip?` is
`!@user_conditions.all? { |c| c.call(arg.target, arg.value) }`
(`callbacks.rb:543-546`).

## Acceptance criteria

- An around callback's thenable `if:` / `unless:` is awaited (sequential,
  short-circuiting at the first falsy value) before `skip?` decides, on an
  async chain; a sync chain raises as Before/After do.
- Condition results use Ruby truthiness (`x != null && x !== false`) in
  `skip?` and `Value.check`.
- A trails test covers an async `if:` returning false on an around callback.
