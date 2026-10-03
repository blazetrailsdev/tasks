---
title: "trailmap: the RFC list loads every story record to count statuses"
status: draft
updated: 2026-10-03
rfc: "0136-trailmap"
cluster: null
packages: []
deps: []
deps-rfc: []
est-loc: 40
priority: null
pr: null
claim: null
assignee: null
blocked-by: null
closed-reason: null
---

## Context

`RfcPagesController#index` (`app/controllers/rfc-pages-controller.ts`) loaded every `Story` record
to count statuses per RFC. Against the live database (177 RFCs, 11,531 stories) that is about one
second per request, on every tab; the page itself reads one field of each record. Measured at trails
`9e17ddc98d`: `Story.all()` 1.0-1.2 s, `Story.pluck("rfc_id", "status")` 5-7 ms.

`/backlog` (2.8 s) and `/stories.json` (2.4 s) pay the same per-record cost and are not in scope
here; they read more than one field.

## Acceptance criteria

- [ ] `/rfcs` instantiates no `Story`, and every tab's HTML is byte-identical to before.
- [ ] A test fails if the action goes back to loading the records.
