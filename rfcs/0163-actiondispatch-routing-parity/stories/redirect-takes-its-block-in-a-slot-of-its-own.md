---
title: "redirect-takes-its-block-in-a-slot-of-its-own"
status: done
updated: 2026-10-14
rfc: "0163-actiondispatch-routing-parity"
cluster: null
packages: []
deps: []
deps-rfc: []
est-loc: null
priority: null
pr: trails#8896
claim: null
assignee: null
blocked-by: null
closed-reason: null
---

## Context

`Redirection#redirect` is `def redirect(*args, &block)`
(`vendor/rails/v8.0.2/actionpack/lib/action_dispatch/routing/redirection.rb:204-215`).
It seeds `block` from `&block` and replaces it only when
`path.respond_to?(:call)`, so `redirect(status: 302) { |params, req| ... }` works.
`redirect` in `packages/actionpack/src/action-dispatch/routing/redirection.ts`
is `redirect(...args)`, which has no block slot. A block reaches it only as
`path`, so the status-plus-block form cannot be expressed:
`extractOptionsBang` sees a function last and pops nothing. trails#8896's
reviewer flagged this.

## Acceptance criteria

- [ ] `redirect` takes the Rails block in a slot of its own, using the trails
      idiom for a rest-plus-block Ruby signature, and seeds `block` from it
      before the `respond_to?(:call)` arm.
- [ ] A test draws `redirect({ status: 302 }, block)` and asserts a 302 to the
      block's path.
