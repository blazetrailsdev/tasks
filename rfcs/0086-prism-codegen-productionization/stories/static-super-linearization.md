---
title: "static-super-linearization"
status: done
updated: 2026-08-01
rfc: "0086-prism-codegen-productionization"
cluster: null
deps: []
deps-rfc: []
est-loc: 250
pr: 5817
claim: "2026-08-01T19:09:02Z"
assignee: "static-super-linearization"
blocked-by: null
closed-reason: null
---

## Context

PR #5727 flattens statement-position module-level `super` (the port realizes
super chains at composition points, e.g. `initInternals` in
`packages/activerecord/src/associations.ts:2285` holding only the module's
contribution with base.ts orchestrating). Value-position `super`
(`x = super`) still declines (`scripts/prism-codegen/handlers/misc.ts`,
ForwardingSuperNode/SuperNode handlers). Ruby's `super` target is statically
computable: parse the `include` order in
`vendor/rails/activerecord/lib/active_record/base.rb`, index which vendored
modules define which methods, and rewrite `super` inside module M's method
`m` into a direct call to the next definer of `m` in the linearization.
Supers resolving outside the AR corpus (into ActiveModel/Object) decline
with a resolves-outside-corpus marker. This also lets the conformance
scorer verify the hand-maintained composition chains match Rails' MRO.

## Acceptance criteria

- A linearization pre-pass (include order + per-module def index) resolves
  each `super` site to its next-definer or an outside-corpus decline.
- Statement- and value-position supers emit direct next-definer calls
  (`.call(this, ...)` shape) when resolvable.
- Tests cover: resolvable chain, method defined in only one module
  (outside-corpus decline), and forwarded args.
