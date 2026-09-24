---
title: "ThroughReflection's remaining source_reflection delegators raise DelegationError on nil"
status: in-progress
updated: 2026-09-24
rfc: "0130-activerecord-extra-surface-receipt-burndown"
cluster: null
packages: []
deps: []
deps-rfc: []
est-loc: 60
priority: 8
pr: trails#8033
claim: "2026-09-24T13:35:28Z"
assignee: "point-value-converges-onto-active-record-point"
blocked-by: null
closed-reason: null
---

## Context

`ThroughReflection` delegates `foreign_key, foreign_type, association_foreign_key, join_id_for, type,
active_record_primary_key, join_foreign_key` to `:source_reflection`
(`vendor/rails/activerecord/lib/active_record/reflection.rb:973-974`); a nil source raises
`DelegationError.nil_target(<method>, :source_reflection)`
(`vendor/rails/activesupport/lib/active_support/delegation.rb:8-9`). trails#7963 converged
`foreignKey` / `foreignType` / `type` only. In `packages/activerecord/src/reflection.ts`:
`activeRecordPrimaryKey` and `associationForeignKey` fall back to `this._delegate.*` on a nil
source (`?? this._delegate...`), `joinForeignKey` uses `src!` (TypeError), and `joinIdFor` is not
delegated on `ThroughReflection` at all (it inherits the `AbstractReflection` body).

## Acceptance criteria

- The four members read `this.sourceReflection` alone and raise
  `DelegationError.nilTarget("<snake_name>", "source_reflection")` when it is nil, matching the
  shape of `foreignKey` in the same class.
- `joinIdFor` on `ThroughReflection` delegates to the source reflection.
- Reflection suites stay green; no call or args rows added.
