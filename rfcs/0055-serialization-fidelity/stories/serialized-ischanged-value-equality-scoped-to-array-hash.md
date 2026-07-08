---
title: "Serialized#isChanged value-equality only covers Array/Hash, not value-== coders (Date/Time)"
status: ready
updated: 2026-07-08
rfc: "0055-serialization-fidelity"
cluster: null
deps: []
deps-rfc: []
est-loc: 40
priority: 36
pr: null
claim: null
assignee: null
blocked-by: null
closed-reason: null
---

## Context

In `packages/activerecord/src/type/serialized.ts`, `Serialized#isChanged`
(added in PR #4736) restores Ruby value-equality only for
`isValueComparable` values (Array / HashWithIndifferentAccess / plain
object). Rails' `Type::Value#changed?` (`vendor/rails/activemodel/lib/active_model/type/value.rb:84-86`)
is `old_value != new_value`, which in Ruby dispatches to each object's own
`==`. A serialized coder whose `load` returns a non-Array/Hash value with
value-based `==` — e.g. `Date`/`Time` — gets Rails value-equality but trails
reference-equality here, since those types are not in `isValueComparable`.

Narrow: no serialized coder currently in the codebase returns such a value,
so this is a latent deviation, not an active bug.

## Acceptance criteria

- Assigning an equal-by-value non-collection coder result (e.g. two `Date`s
  for the same day) reports `isChanged` = false, matching Rails' `Date#==`.
- No regression for the Array/Hash/plain-object cases already covered.
- Reference-equality fallback preserved for coder objects with identity `==`
  (custom `object_class` instances), matching Ruby's default `Object#==`.
