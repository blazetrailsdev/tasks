---
title: "ringo: flip TASKS_EVENTS_SOURCE to db so /graphs/velocity reads the events table"
status: blocked
updated: 2026-10-15
rfc: "0136-trailmap"
cluster: null
packages: []
deps:
  - serve-the-read-verbs-as-json
  - retarget-the-velocity-story-at-ringo
deps-rfc: []
est-loc: 40
priority: null
pr: null
claim: null
assignee: null
blocked-by: "All its work is in btwhooks (webhook/taskevents.go, TASKS_EVENTS_SOURCE), which has no GitHub remote; trailmap#68 claimed and released it. Held until retarget-the-velocity-story-at-ringo rewrites it or ringo gets a reviewable remote."
closed-reason: null
---

## Context

**This is ringo work, in btwhooks — not trailmap work.** `/graphs/velocity` is
ringo's page (`webhook/velocity.go`, `webhook/velocity_page.go`, routed in
`main.go`). trailmap serves no velocity chart and parses no commit subjects;
trailmap#68 claimed this story in a bundle and released it for that reason.
btwhooks has no GitHub remote, so no trailmap or trails worker can open a PR
for it: it is done by hand on the box, and it stays out of the trailmap spawn
queue (it is `blocked` with that reason until someone takes it there).

The chart reads the tasks repo's **git log** today. ringo's README describes
that log as an event stream — one commit per CLI verb, `new:`, `claim:`,
`in-progress: <story> #<pr>`, `done:` and so on — but that is stale: only
`tasks new` still commits per mutation, and state reaches git in hourly
`state: sync N stories` batches. The per-verb subjects the chart parses are
mostly no longer produced, so it is very likely undercounting.

Most of the replacement already exists. `webhook/taskevents.go` has a
`TASKS_EVENTS_SOURCE` switch — `git` (THE DEFAULT), `db` (the `events` table,
read straight out of `tasks.db`), `json` and `auto` — and the non-git paths
synthesize commit subjects (`taskEventSubject`) so the one parser in
`velocity.go` runs unchanged. What is left is to flip it and check the numbers.

**Reconciled with the API.** This story first asked for the events table
"through the API" (trailmap's `GET /events`). ringo's `db` source reads
`tasks.db` directly, read-only, which `docs/write-protocol.md` in trailmap
allows — every table is readable by both processes — and it is the same table
`/events` serves. Going through HTTP would add a dependency on trailmap being
up for a chart, and nothing else. The `db` source is the target; switching it to
`/events` is a separate decision for when ringo stops opening `tasks.db` at
all (RFC 0136 phase G).

## Acceptance criteria

- `TASKS_EVENTS_SOURCE=db` is set for btwhooks (its dokku config or the
  default in `eventsSource()`), and `/graphs/velocity` renders from it.
- The weekly figures under `git` and under `db` are compared for the same
  weeks and recorded on this story, saying whether git was undercounting —
  the chart's numbers will move, and that should read as a correction.
- A decision is recorded on whether the subject-synthesis layer
  (`taskEventSubject` feeding the git-subject parser) goes, in favour of
  deriving the weekly counts from event rows directly. If it goes, nothing in
  velocity parses commit subjects.
