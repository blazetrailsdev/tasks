---
title: "Consolidate dependent-handling dispatch paths"
status: done
rfc: "0005-activerecord-gaps"
cluster: associations
deps: []
deps-rfc: []
est-loc: 80
pr: null
claim: null
assignee: null
blocked-by: null
---

## Context

`processDependentAssociations` is an inline reimplementation that duplicates the
`handleDependency` dispatch. Unify `deleteAll` and `before_destroy` →
`handleDependency` through the `deleteOrNullifyAllRecords` override dispatch.

## Acceptance criteria

- [ ] `processDependentAssociations` inline reimplementation retired
- [ ] `deleteAll` and `before_destroy` both dispatch through `handleDependency`
      via the `deleteOrNullifyAllRecords` override
- [ ] No behavior change in dependent-destroy/nullify/delete-all tests

## Notes

From the associations gap plan (Round-4 follow-up), ready now.
