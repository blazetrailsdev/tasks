---
title: "nested-attributes-index-errors-validation"
status: done
updated: 2026-07-05
rfc: "0052-nested-attributes-fidelity"
cluster: null
deps: []
deps-rfc: []
est-loc: null
priority: 1
pr: 4607
claim: "2026-07-05T12:52:31Z"
assignee: "nested-attributes-index-errors-validation"
blocked-by: null
---

## Context

Surfaced by `converge-nested-attributes-test-one-schema` (faithful port of
`vendor/rails/activerecord/test/cases/nested_attributes_test.rb`). The two
`TestIndexErrorsWithNestedAttributesOnlyMode` cases are skipped
(tracked-pending-convergence) in `packages/activerecord/src/nested-attributes.test.ts`
("index in nested_attributes_order order", "index unaffected by reject_if").

trails does not propagate `index_errors`-keyed nested has_many validation to the
parent's `valid?` when the children are assigned in-memory via nested attributes
(the indexed nested-record validators are not run for the assigned/unloaded
target). Rails surfaces errors keyed `tuning_pegs[0].pitch`.

## Acceptance criteria

- [ ] Un-skip both `TestIndexErrorsWithNestedAttributesOnlyMode` cases and make
      them pass against canonical `Guitar`/`TuningPeg`.
- [ ] Parent `valid?` runs indexed nested validators; errors keyed `assoc[i].attr`.
