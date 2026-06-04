---
title: "Collection size / add-to-target AR-id identity reconciliation"
status: ready
rfc: "0005-activerecord-gaps"
cluster: associations
deps: []
deps-rfc: []
est-loc: 70
priority: 31
pr: null
claim: null
assignee: null
blocked-by: null
---

## Context

Reconcile collection identity/size handling with Rails: the two
`foreign_key_present?` implementations, AR-id equality in `_addToTarget`, and the
`count_records` port.

## Acceptance criteria

- [ ] `foreign_key_present?` implementations reconciled to one faithful version
- [ ] AR-id equality ported into `_addToTarget`
- [ ] `build` / `createBang` routed through `_addToTarget`
- [ ] Faithful `count_records` ported

## Notes

From the associations gap plan (Round-4 follow-up), ready now.
