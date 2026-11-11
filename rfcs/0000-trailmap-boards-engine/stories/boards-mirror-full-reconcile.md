---
title: "Mirror the task domain into boards: a full, idempotent reconcile"
status: draft
updated: 2026-11-11
rfc: "0000-trailmap-boards-engine"
cluster: mirror
packages: []
deps: [boards-schema-and-models]
deps-rfc: []
est-loc: 500
priority: null
pr: null
claim: null
assignee: null
blocked-by: null
---

## Context

Phase 1 of the RFC. Read through trailmap's existing `Rfc`, `Story`,
`StoryDep`, `StoryRfcDep`, `StoryPackage`, `StoryPath` and `Event` models.
Upsert by id. Status maps to a list by role, and `closed` maps to
`archived` plus a comment carrying `closed_reason`. `desc` comes from the
stored document body. Priorities map to positions that keep the ready-queue
order.

## Acceptance criteria

- [ ] `Boards::MirrorJob.performNow({ full: true })` builds boards from an empty database and is a no-op on a second run
- [ ] A story moved, retitled or deleted in the task domain is reflected after the next run
- [ ] Recurring nightly in `config/recurring` (Solid Queue)
- [ ] A test over a fixture copy of `tasks.db` checks counts per role and per board
