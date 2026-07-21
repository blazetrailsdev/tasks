---
title: "arel-nodeorvalue-scalars-rails-unsupported"
status: ready
updated: 2026-07-21
rfc: "0066-arel-visitor-fidelity"
cluster: null
deps: []
deps-rfc: []
est-loc: null
priority: null
pr: null
claim: null
assignee: null
blocked-by: null
closed-reason: null
---

## Context

Raised in review of PR #5026 (arel-visitor-quotes-temporal-where-rails-raises),
which dropped the five Temporal arms from `NodeOrValue`
(packages/arel/src/nodes/binary.ts:14-35) because Rails aliases
`visit_Date`/`visit_DateTime`/`visit_Time` to `unsupported`
(vendor/rails/activerecord/lib/arel/visitors/to_sql.rb:836/837/844).

The identical argument applies to the remaining scalar arms. In Rails only
`visit_Integer` renders (to_sql.rb:824); `visit_String` (:842),
`visit_Float` (:839), `visit_TrueClass` (:845), `visit_FalseClass` (:838) and
`visit_NilClass` (:841) are all aliased to `unsupported`. Yet `string`,
`number` (Float included), `boolean`, `null` and `undefined` remain in the
union.

They were left in scope-out of #5026 because trails' invented literal quoting
(see project_rails_arel_does_no_value_formatting..., converged #4868) still
depends on them. A call-site note in binary.ts points here.

## Acceptance criteria

- [ ] Determine which of `string` / non-integer `number` / `boolean` / `null` /
      `undefined` still have real callers passing them raw into a node slot.
- [ ] For those with none: drop the arm and let the raw value raise, as Rails
      does; callers wrap in `Casted`/`BindParam`.
- [ ] For any that survive: justify at the call site with a Rails citation.
- [ ] Split `number` if needed — `visit_Integer` renders, `visit_Float` raises.
- [ ] api:compare / test:compare delta non-negative.
