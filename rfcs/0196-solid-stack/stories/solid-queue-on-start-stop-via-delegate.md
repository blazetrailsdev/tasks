---
title: "SolidQueue.on_start/on_stop via delegate to: Supervisor"
status: draft
updated: 2026-11-08
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

`vendor/solid_queue/v1.1.3/lib/solid_queue.rb:44` is `delegate :on_start, :on_stop, to: Supervisor`.
trails#9866 ported it in `packages/solid-queue/src/solid-queue.ts` as hand-written `onStart` / `onStop`
forwarders, because `delegate.call(SolidQueue, "onStart", "onStop", { to: "Supervisor" })` raised
`TypeError: Class constructor Supervisor cannot be invoked without 'new'`. activesupport's `delegate`
calls a `to:` target that is a function (here the class seated on `SolidQueue.Supervisor`) as a
method, where Ruby's `to: Supervisor` names a constant receiver
(`vendor/rails/v8.0.2/activesupport/lib/active_support/core_ext/module/delegation.rb`).

## Acceptance criteria

- activesupport `delegate` treats a class/constant target as the receiver, not as a zero-arg method.
- `solid-queue.ts` replaces the two forwarders with the single `delegate` call at the Rails position
  (after the `mattr_accessor` lines), and the lifecycle-hooks tests still pass.
