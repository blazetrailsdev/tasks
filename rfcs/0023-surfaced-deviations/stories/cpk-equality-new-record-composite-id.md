---
title: "cpk-equality-new-record-composite-id"
status: claimed
updated: 2026-07-01
rfc: "0023-surfaced-deviations"
cluster: null
deps: []
deps-rfc: []
est-loc: null
priority: null
pr: null
claim: "2026-07-01T04:24:47Z"
assignee: "cpk-equality-new-record-composite-id"
blocked-by: null
---

## Context

Surfaced while converging `core.test.ts` to canonical Rails `CoreTest`
(RFC 0048 one-schema). Rails `test_composite_pk_models_equality`
(`activerecord/test/cases/core_test.rb:275-283`) asserts
`Cpk::Book.new(id: [1, 2]) == Cpk::Book.new(id: [1, 2])` is **true**.

In trails, `new CpkBook({ id: [1, 2] }).equals(new CpkBook({ id: [1, 2] }))`
returns **false** for two new (unpersisted) records with the same composite id.
Rails `ActiveRecord::Core#==` (`activerecord/lib/active_record/core.rb:637-649`)
compares `comparison_object.id` when `id` is present, so equal composite ids
compare equal even for new records. trails' equality appears to fall back to
identity for new records / not compare composite id arrays by value.

This blocks faithful porting of `test_composite_pk_models_equality`,
`test_composite_pk_models_added_to_a_set`, and `test_composite_pk_models_hash`
(the last two also need Ruby `Set`/`hash`, but all three hinge on `==`).

## Acceptance criteria

- `CpkBook.new(id:[1,2]).equals(CpkBook.new(id:[1,2]))` is `true`; differing
  composite ids and two id-less new records compare unequal, matching
  `core.rb:637-649`.
- Un-skip `test_composite_pk_models_equality` in `core.test.ts` and assert the
  full Rails matrix (equal ids, unequal ids, two `new`, author_id-only, etc.).
