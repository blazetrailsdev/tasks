---
title: "Self-referential belongsTo-source push for has_many :through"
status: ready
rfc: "0005-activerecord-gaps"
cluster: associations
deps: []
deps-rfc: []
est-loc: 100
pr: null
claim: null
assignee: null
blocked-by: null
---

## Context

`collection << record` does not persist the join row's nonstandard FK for a
self-referential has_many :through. Likely in `collection-proxy.ts` or the HMT
insert path.

## Acceptance criteria

- [ ] `collection << record` persists the join row with the correct nonstandard
      FK for self-referential HMT
- [ ] Regression test for the self-referential HMT push

## Notes

From the associations gap plan (Round-4 follow-up), ready now.
