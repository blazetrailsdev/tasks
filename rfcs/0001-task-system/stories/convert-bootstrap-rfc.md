---
title: "Convert a real plan doc to RFC 0002 (bootstrap→DatabaseTasks)"
status: done
updated: 2026-05-29
rfc: "0001-task-system"
cluster: conversion
deps: ["scaffold-tooling"]
est-loc: 200
pr: null
claim: null
assignee: null
blocked-by: null
---

## Context

The second conversion proves the RFC system against real, complex content. The
original target was `connection-pooled-test-adapter-plan.md`, but that epic
shipped 2026-05-28 (archival), so it was repointed to the live
`docs/activerecord/bootstrap-to-databasetasks-plan.md` — an active, unstarted,
cohesive epic with a clean phased PR plan. Activerecord is the migration
priority.

See RFC 0001 §Rollout step 4.

## Acceptance criteria

- [x] `rfcs/0002-bootstrap-databasetasks/README.md` exists and follows the
      section order of RFC 0001
- [x] Story files exist for the phased PRs (PR 0–3) plus the spike, the
      reconstruct-parity prerequisite, and the two follow-ups, with accurate
      `deps`
- [ ] Source plan doc removed from trails (migrated to RFC 0002) — trails
      PR #2663, awaiting merge
- [x] `pnpm tasks ready --rfc 0002-bootstrap-databasetasks` returns the
      expected unblocked stories

## Notes

The source plan doc lives in the **trails** repo, which is PR-based and worktree-
only; the redirect-notice edit ships as a separate trails PR, not from this repo.

The connection-pool epic's short-lived MEMORY.md state is moot — that work
shipped before this conversion.
