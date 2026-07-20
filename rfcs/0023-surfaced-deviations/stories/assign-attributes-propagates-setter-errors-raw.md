---
title: "assign_attributes lets setter exceptions propagate raw (no AttributeAssignmentError wrap)"
status: draft
updated: 2026-07-20
rfc: "0023-surfaced-deviations"
cluster: null
deps: []
deps-rfc: []
est-loc: 100
priority: null
pr: null
claim: null
assignee: null
blocked-by: null
closed-reason: null
---

## Context

`AttributeAssignment#assign_attributes` in Rails lets a setter exception
propagate **raw** — only multiparameter assignment wraps into
`MultiparameterAssignmentErrors`. Trails deviates: `assignAttributes`
(`packages/activerecord/src/persistence.ts:1042-1081`, and the sibling
`_assignAttributes` path) catches any per-key setter throw and re-wraps it in
`AttributeAssignmentError` with the offending key/value. The JSDoc at
`persistence.ts:1034-1040` explicitly flags this as a known, longstanding
Rails-fidelity gap deferred to a follow-up.

Surfaced concretely by RFC 0068 #4949 (has-one-setter-throws-on-persisted-owner):
mass-assigning a has_one on a persisted owner throws
`HasOnePersistedAssignmentError` from the setter, but callers of
`assignAttributes`/`update` observe it wrapped in `AttributeAssignmentError`
(its message carries the inner text). The trails test
`packages/activerecord/src/associations/has-one-persisted-setter-throws.trails.test.ts`
had to match the wrapper's message rather than the raw error class as a result.

Rails source: `activemodel/lib/active_model/attribute_assignment.rb`
(`_assign_attributes` / `_assign_attribute`) — no wrap; the `public_send`
exception propagates. Only `NoMethodError` on an unknown setter is translated
(to `UnknownAttributeError`).

## Acceptance criteria

- [ ] `assignAttributes` / `update` let a setter exception propagate raw
      (e.g. `HasOnePersistedAssignmentError`, `AssociationTypeMismatch`),
      matching Rails — no `AttributeAssignmentError` re-wrap.
- [ ] Unknown-attribute setter still surfaces `UnknownAttributeError`.
- [ ] Multiparameter assignment still wraps into
      `MultiparameterAssignmentErrors` (unchanged — that wrap IS Rails).
- [ ] Update the trails test above to assert the raw error class once the
      wrap is gone; audit other tests relying on the `AttributeAssignmentError`
      wrap and migrate them (no test renames).
- [ ] Decide whether `AttributeAssignmentError` is retired or kept for a
      narrower purpose; if retired, remove the export.
