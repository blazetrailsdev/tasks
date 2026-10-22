---
title: "ringo: record every cron run as a row in events"
status: draft
updated: 2026-10-22
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

`serve-the-crons-page` is blocked: its acceptance criteria want last-run and
outcome read from `events`, and nothing writes cron runs there. ringo's merge
sweep (webhook/mergesweep.go:163) and claim sweep (webhook/claimsweep.go:268)
shell out to the CLI with no identifying actor, so their done/release rows
cannot be told apart from anyone else's. The worktree sweep, the stats sync
(read back from its own log, webhook/crons.go:58) and the smoke tiers write
nothing at all.

`move-deploys-and-sweeps-into-the-database` covers only the merge sweep's
JSON file.

## Acceptance criteria

- Each run of every job in `HandleCronsData` (webhook/crons.go:33) writes one
  `events` row: verb `cron-run`, actor = the job's `kind`, detail = the
  outcome as JSON (what it touched, what it skipped and why, any error).
- Mutations a sweep makes carry the sweep as their actor.
- Written through webhook/tasksdb.go's write path, with the same retry rule.
- Found on trailmap#77.
