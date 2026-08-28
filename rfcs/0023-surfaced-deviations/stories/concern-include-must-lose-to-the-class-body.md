---
title: "Make Concern's non-prepend include lose to a class-body method"
status: draft
updated: 2026-08-28
rfc: "0023-surfaced-deviations"
cluster: null
packages: []
deps: []
deps-rfc: []
est-loc: 160
priority: null
pr: null
claim: null
assignee: null
blocked-by: null
closed-reason: null
---

## Context

`ActiveSupport::Concern`'s `append_features` does a plain Ruby `include`
(`activesupport/lib/active_support/concern.rb:132`), so a concern's instance
methods land BELOW the includer's class body in the ancestry — a `def x`
written in the class wins over the concern's `x`.

trails' `packages/activesupport/src/concern.ts:82-100` does the opposite: its
non-prepend branch copies every entry of `def.instanceMethods` onto
`klass.prototype` unconditionally, so a concern silently clobbers a class-body
method. Its own comment states the intent ("Concerns overwrite existing
methods"), and `concern.test.ts`'s `prepend: false does not save _super_ method`
pins the divergence.

Found while making `extend()` honor class-body precedence (PR #7151): that
branch used to route through `extend()`, and the copy had to be spelled out
inline to keep the old behaviour once `extend()` was converged.

## Converged shape

Route the non-prepend branch through `include()` from
`packages/activesupport/src/include.ts`, which already implements Ruby's
precedence — an own untracked key (class body) is preserved, an earlier
mixin's key is replaced. Retire the inline copy loop and the `extended`-hook
fire beside it, and re-derive `concern.test.ts`'s expectations from Ruby's
`include` semantics rather than from the current overwrite behaviour.

## Acceptance criteria

- `Concern.include`'s non-prepend branch loses to a class-body method, as
  concern.rb:132's plain `include` does; `prepend: true` still wins.
- No bespoke descriptor-copy loop remains in `concern.ts`.
- activesupport suite green.
