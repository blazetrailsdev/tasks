---
title: "trailmap: /events.json takes 5-9 s and returns 10 MB"
status: draft
updated: 2026-10-04
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

Measured while checking trailmap#33 (production mode, live copy): `/events.json` takes 5.6-8.9 s
and returns 10 MB. It is `ReadModelsController#events` (`app/controllers/read-models-controller.ts`),
which exists to replace ringo's own copy of the event log, so ringo pays this on every read. It was
not touched by #31 or #33 and its cost has not been broken down; the `Event` records are the likely
bulk, at the per-record cost in `record-instantiation-costs-ninety-microseconds-a-row`.

## Acceptance criteria

- [ ] The time is accounted for: query, record building, serialization.
- [ ] `/events.json` answers in under 1 s against the live database with byte-identical output, or supports a `since` bound so ringo does not fetch the whole log.
