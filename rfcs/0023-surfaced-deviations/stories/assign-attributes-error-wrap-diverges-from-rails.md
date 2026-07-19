---
title: "Stop wrapping ordinary assignment errors in AttributeAssignmentError"
status: draft
updated: 2026-07-19
rfc: "0023-surfaced-deviations"
cluster: null
deps: []
deps-rfc: []
est-loc: 70
priority: null
pr: null
claim: null
assignee: null
blocked-by: null
closed-reason: null
---

## Context

`assignAttributes` (packages/activerecord/src/persistence.ts:1047+) wraps every
setter/`writeAttribute` failure in `AttributeAssignmentError` with the offending
key/value. Rails' `_assign_attributes` lets setter exceptions **propagate raw**
(`vendor/rails/activemodel/lib/active_model/attribute_assignment.rb:36-48`);
`AttributeAssignmentError` exists in Rails only for the multiparameter path
(`vendor/rails/activerecord/lib/active_record/attribute_assignment.rb`), not for
ordinary key assignment.

The divergence is longstanding and acknowledged in the doc comment on
`assignAttributes`: "ours additionally wraps them in AttributeAssignmentError
... That wrapping is stricter than Rails but longstanding — preserved by this
extraction; revisiting the Rails-fidelity gap can happen in a follow-up."

This is the root cause of a second deviation: `#update` / `#update!` avoid
`Base#assignAttributes` entirely and hand-roll a raw `writeAttribute` loop
precisely to dodge the wrap, which is why trails has two assignment paths where
Rails has one (see `update-unify-setter-dispatch-with-assign-attributes` — that
story is blocked on this one).

Surfaced while reviewing #4972.

## Acceptance criteria

- [ ] Ordinary (non-multiparameter) assignment failures propagate the original
      error class, matching `_assign_attributes`.
- [ ] `AttributeAssignmentError` is still raised where Rails raises it — the
      multiparameter path only.
- [ ] Audit callers/tests that assert on `AttributeAssignmentError` for ordinary
      keys and converge them to the Rails-expected class.
- [ ] Update the `assignAttributes` doc comment, which currently documents the
      divergence as intentional.
