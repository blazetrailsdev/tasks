---
title: "Port Core#hash + Set dedup for composite-pk models"
status: claimed
updated: 2026-07-01
rfc: "0023-surfaced-deviations"
cluster: null
deps: []
deps-rfc: []
est-loc: 60
priority: null
pr: null
claim: "2026-07-01T10:54:45Z"
assignee: "composite-pk-models-hash-and-set"
blocked-by: null
---

## Context

Follow-up surfaced by cpk-equality-new-record-composite-id (PR #4362), which
fixed `Core#==` to compare composite ids by value. Two sibling Rails tests in
`activerecord/test/cases/core_test.rb` remain unported because they hinge on a
Ruby `hash`/`Set` equivalent that trails lacks:

- `test_composite_pk_models_hash` — asserts `Cpk::Book.new(id:[1,2]).hash ==
Cpk::Book.new(id:[1,2]).hash` and inequality for differing/absent composite
  ids. Rails `Core#hash` (`core.rb`) returns `[self.class, id].hash` when
  `composite_primary_key? ? primary_key_values_present? : id`, else `super`.
- `test_composite_pk_models_added_to_a_set` — dedups `Cpk::Book` instances in a
  `Set`, which relies on `hash` + `eql?` (aliased to `==`).

trails has no `hash` method on records and no Ruby-`Set`-equivalent dedup
surface. `==`/`eql?` parity already landed in #4362; this story adds a faithful
`hash` and ports both tests (using whatever JS structure mirrors Ruby `Set`
dedup semantics — e.g. keying by `[class, id]`).

## Acceptance criteria

- A `Core#hash`-equivalent on records matching `core.rb` (composite: gate on
  `primaryKeyValuesPresent`; scalar: gate on `id`; else identity/super).
- Port `test_composite_pk_models_hash` and
  `test_composite_pk_models_added_to_a_set` verbatim into `core.test.ts`,
  asserting the full Rails matrix.
