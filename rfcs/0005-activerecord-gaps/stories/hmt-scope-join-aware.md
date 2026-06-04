---
title: "Make HMT scope() join-aware like Rails"
status: ready
rfc: "0005-activerecord-gaps"
cluster: associations
deps: []
deps-rfc: []
est-loc: 15
priority: 13
pr: null
claim: null
assignee: null
blocked-by: null
---

## Context

The has_many :through `scope()` uses a lightweight
`throughScope(assoc) ?? assoc.scope?.()` fallback. Rails uses a join-aware
`through_scope || self.scope`.

## Acceptance criteria

- [ ] HMT `scope()` is join-aware, matching Rails' `through_scope || self.scope`
- [ ] Existing HMT scope tests stay green

## Notes

From the associations gap plan (Round-4 follow-up), ready now. ~15 LOC.
