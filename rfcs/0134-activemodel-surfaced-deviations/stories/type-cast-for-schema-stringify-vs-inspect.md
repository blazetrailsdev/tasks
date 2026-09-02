---
title: "activemodel: Type#typeCastForSchema spells Ruby inspect as JSON.stringify"
status: done
updated: 2026-09-02
rfc: "0134-activemodel-surfaced-deviations"
cluster: rails-deviation
packages: ["activemodel"]
deps: []
deps-rfc: []
est-loc: 20
priority: 10
pr: 7396
claim: "2026-09-02T17:16:38Z"
assignee: "attribute-user-provided-default-slot-guard-invented-throw"
blocked-by: null
closed-reason: null
---

## Context

Rails `Value#type_cast_for_schema` is `value.inspect`
(`vendor/rails/activemodel/lib/active_model/type/value.rb:71-73`). trails
(`packages/activemodel/src/type/value.ts:48-51`) uses
`JSON.stringify(value) ?? String(value)` (bigint special-cased). Output
diverges: `nil` renders `"null"` not `"nil"`, and string quoting differs.
The repo already consolidated a Ruby-`inspect` helper during the arel work
(see 0124's inspect-consolidation stories) — use that, don't hand-roll.

## Acceptance criteria

- `typeCastForSchema` renders through the repo's Ruby-`inspect` analogue,
  matching MRI's `inspect` for nil, strings, numerics, and booleans (pin
  against `ruby`).
- Schema-dump call sites in activerecord that consume it stay green (run the
  touched test files only).

## Notes

Family context, already established by
`0115-activemodel-fidelity-convergence/stories/port-time-value-type-cast-for-schema.md`
(done, PR #6788): `Type::Date` (`date.ts:40`) and `Type::Decimal`
(`decimal.ts:18`) carry their own `type_cast_for_schema` overrides, and
`Type::DateTime` / `Type::Time` inherit the base `Value` one — which is
exactly the body this story fixes, so the fix propagates to both.
