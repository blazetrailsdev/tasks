---
title: "One authority switch: mutations write boards when meta.authority is boards"
status: draft
updated: 2026-11-11
rfc: "0233-trailmap-boards-engine"
cluster: flip
packages: []
deps: [boards-equivalence-gate, boards-card-api-routes]
deps-rfc: []
est-loc: 450
priority: null
pr: null
claim: null
assignee: null
blocked-by: null
---

## Context

Phase 3. While `meta.authority = boards`, every mutation (old and new routes)
writes `Boards` models and records an `Action`. The forward mirror stops.
Flipping back to `tasks` restores today's path, and the mirror resumes from
its cursor. The flip is a `trails` task, not a hand edit to the database.

## Acceptance criteria

- [ ] `bin/trails boards:authority[boards|tasks]` flips it and logs an `Action`
- [ ] Refusal semantics (claim races, done-with-blocked-by) are ported onto the Boards models with the same exit codes
- [ ] Request tests run every verb under both authorities
