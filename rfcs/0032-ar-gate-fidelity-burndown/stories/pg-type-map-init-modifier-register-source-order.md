---
title: "Mirror Rails' add_modifier-before-register order in PG type-map-init"
status: ready
updated: 2026-07-25
rfc: "0032-ar-gate-fidelity-burndown"
cluster: null
deps: []
deps-rfc: []
est-loc: 15
priority: null
pr: null
claim: null
assignee: null
blocked-by: null
closed-reason: null
---

## Context

`packages/activerecord/src/connection-adapters/postgresql/type-map-init.ts`
emits the two `ArType.addModifier` calls (array/range) _after_ the
`ArType.register` block. Rails does the reverse: `postgresql_adapter.rb:1166-1167`
registers both modifiers _before_ the `register(:bit, ...)` block that runs
`1168-1185`.

The modifiers landed in #5203 and the now-contradictory comment above the
register block was deleted in #5280; neither PR addressed source order.

Order is believed cosmetic — `Type.register` and `Type.add_modifier` feed
separate lists on the registry, so no lookup should depend on interleaving.
This story is to confirm that (read `ActiveRecord::Type::Registry` in
`vendor/rails/activerecord/lib/active_record/type.rb` and trails' `ArType`) and
then either move the two `addModifier` lines above the register block to match
Rails' layout, or record at the call site why trails keeps them below.

## Acceptance criteria

- The registry is inspected to confirm whether register/addModifier ordering is
  behaviorally significant.
- Either the two `addModifier` calls are moved to mirror
  `postgresql_adapter.rb:1166-1167` source order, or a call-site comment states
  why the trails order differs.
- No behavior change; existing PG type tests still pass.
