---
title: "activemodel: Type#typeCastForSchema spells Ruby inspect as JSON.stringify"
status: ready
updated: 2026-09-01
rfc: "0000-activemodel-surfaced-deviations"
cluster: rails-deviation
packages: ["activemodel"]
deps: []
deps-rfc: []
est-loc: 20
priority: null
pr: null
claim: null
assignee: null
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
