---
title: "R3 — align the 3 reorder-replaces-existing-order tests to Rails"
status: ready
rfc: "0005-activerecord-gaps"
cluster: relation
deps: []
deps-rfc: []
est-loc: 20
priority: 15
pr: null
claim: null
assignee: null
blocked-by: null
---

## Context

Three pre-existing "reorder replaces existing order" tests need verification
against their Rails counterparts (`test_finding_with_reorder` /
`test_reorder_deduplication`).

## Acceptance criteria

- [ ] Each of the 3 tests mapped to a real Rails test
- [ ] Body + name aligned so `test:compare` matches, or the genuine gap documented

## Notes

From the relation gap plan (R3), ready now.
