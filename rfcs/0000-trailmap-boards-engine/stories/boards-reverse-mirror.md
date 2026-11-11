---
title: "Reverse mirror: write the task-domain tables from boards while it is the authority"
status: draft
updated: 2026-11-11
rfc: "0000-trailmap-boards-engine"
cluster: flip
packages: []
deps: [boards-authority-switch]
deps-rfc: []
est-loc: 450
priority: null
pr: null
claim: null
assignee: null
blocked-by: null
---

## Context

In phase 3, ringo, the `index.json` / `events.json` read models and every old
reader still read the `stories` / `rfcs` / `events` tables. `Boards::ReverseMirrorJob`
writes them from boards, `Action`s become `events` rows, and the read models
are republished as today.

## Acceptance criteria

- [ ] After any boards mutation, the old tables and published read models match within one job run
- [ ] The equivalence gate passes in the reverse direction
- [ ] The job does nothing while the authority is `tasks`
