---
title: "Association-scope polymorphic-through alias coverage"
status: ready
rfc: "0005-activerecord-gaps"
cluster: associations
deps: []
deps-rfc: []
est-loc: 50
priority: 32
pr: null
claim: null
assignee: null
blocked-by: null
---

## Context

For a polymorphic-source-through association under table aliasing, the `_type`
WHERE qualifier alias is not pinned by a test. Add coverage and consider routing
the table comparison through Arel `Table` identity.

## Acceptance criteria

- [ ] Test pins the `_type` WHERE alias qualifier under table aliasing for
      polymorphic-source-through
- [ ] (If needed) table comparison routed through Arel `Table` identity

## Notes

From the associations gap plan (Round-4 follow-up), ready now.
