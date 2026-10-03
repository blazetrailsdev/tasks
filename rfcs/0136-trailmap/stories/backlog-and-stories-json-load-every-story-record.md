---
title: "trailmap: /backlog and /stories.json take 2-3 s loading every story record"
status: draft
updated: 2026-10-03
rfc: "0136-trailmap"
cluster: null
packages: []
deps: []
deps-rfc: []
est-loc: 150
priority: null
pr: null
claim: null
assignee: null
blocked-by: null
closed-reason: null
---

## Context

Follow-up to trailmap#31, which took `/rfcs` from 1.1 s to 0.06 s by not loading `Story` records.
Two more pages load every story and pay about 90 µs a record (measured in production mode against
177 RFCs and 11,531 stories):

- `/backlog`: 2.8 s, 954 KB of HTML. Also unpaginated; see `paginate-the-backlog-list-page`.
- `/stories.json`: 2.4 s, 8 MB.

Both read several fields, so plucking two columns is not the fix. Options: pluck the columns each
needs, page the backlog, or wait on the framework story
`record-instantiation-costs-ninety-microseconds-a-row`.

## Acceptance criteria

- [ ] `/backlog` and `/stories.json` each answer in under 500 ms against the live database, with byte-identical output.
