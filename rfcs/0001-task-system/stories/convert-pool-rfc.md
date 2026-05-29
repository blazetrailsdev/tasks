---
title: "Convert connection-pool plan doc to RFC 0002"
status: draft
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

`docs/activerecord/connection-pooled-test-adapter-plan.md` is the most
active epic and the most frequent spawn-loop target. Converting it first
exercises the RFC template against real, complex content and gives
tasks-loop something to bind to once `wire-tasks-loop` ships.

The existing plan doc already itemizes phases A–G with clear blocking
relationships, which map cleanly onto stories.

See RFC 0001 §Rollout step 4.

## Acceptance criteria

- [ ] `docs/rfcs/0002-connection-pool/README.md` exists and follows the
      section order of RFC 0001
- [ ] Story files exist for the 8 remaining D-1..N bypass-elimination
      sites and the Phase E/F cleanup stories, with accurate `deps`
- [ ] Existing plan doc gains a redirect notice at the top pointing to
      the new RFC (do not delete yet)
- [ ] `pnpm tasks ready --rfc 0002-connection-pool` returns the expected
      unblocked stories

## Notes

Use `git log -- docs/activerecord/connection-pooled-test-adapter-plan.md`
to recover the historical decision context worth preserving in the
Alternatives section.

MEMORY.md currently holds short-lived state for this epic
(`project_pool_epic_phase_d_pivot`, etc.). Per RFC 0001 open question 4,
those entries should be removed in this PR.
