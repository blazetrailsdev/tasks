---
title: "Serve /crons read-only from trailmap, beside ringo"
status: ready
updated: 2026-09-09
rfc: "0136-trailmap"
cluster: null
packages: ["trailties"]
deps: []
deps-rfc: []
est-loc: 200
priority: 5
pr: null
claim: null
assignee: null
blocked-by: null
closed-reason: null
---

## Context

ringo serves `/crons` plus three sweep triggers — `/crons/claim-sweep`,
`/crons/merge-sweep`, `/crons/worktree-sweep` — from `webhook/crons.go`. The
page lists the scheduled jobs, when each last ran and what it did. Every one of
those sweeps reads or writes `tasks.db` through the CLI or through
`webhook/tasksdb.go`, so the page is task domain even though it renders as
operations.

This is phase B of RFC 0136's revised rollout: trailmap serves the page
read-only, beside ringo, and nothing is deleted. The trigger buttons stay on
ringo for now — a POST that shells out to a sweep is a phase F concern.

## Acceptance criteria

- `/crons` renders in trailmap from the models, listing the same jobs in the
  same order as ringo's page.
- Read-only: no trigger endpoints are served, and ringo's page keeps working
  unchanged.
- The last-run and outcome columns come from the `events` table, not from a
  file on disk.
- A controller test covers the page against seeded data.
- Any framework gap hit while building it is filed as a trails story and cited
  in the PR body.
