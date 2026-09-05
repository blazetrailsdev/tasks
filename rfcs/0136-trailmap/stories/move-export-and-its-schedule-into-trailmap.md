---
title: "Move export (DB to git) and the hourly ingest/export schedule into trailmap"
status: ready
updated: 2026-09-05
rfc: "0136-trailmap"
cluster: null
packages: ["activerecord"]
deps: ["move-the-tasks-cli-into-trailmap"]
deps-rfc: []
est-loc: 250
priority: 10
pr: null
claim: null
assignee: null
blocked-by: null
closed-reason: null
---

## Context

The plan covers `ingest` (git to DB) but not its opposite, and `export` is
load-bearing. `src/export.ts` writes DB-owned fields back into story markdown
on an hourly timer, never in the mutation path — and its header explains what
that buys: it "is the whole reason the old repo's 27k status-flip commits go
away", giving state "a durable plaintext backup" without a commit per claim.

It also carries a property that must survive the move, currently guarded by a
test: export writes only DB-owned fields and ingest reads only markdown-owned
ones, so export's commits are inert to ingest. Break that and the two
directions ping-pong forever.

Both directions are scheduled from ringo today, not from the tasks repo:

- `webhook/tasksingest.go:96-97` runs `ingest` then `export` hourly.
- `:49` runs `ingest` immediately when a tasks PR merges, because the hourly
  cron is only a backstop — a stale dependency can dispatch a story whose new
  blocker is not recorded yet.

After the cutover the schedule belongs in trailmap, which owns the database and
the checkout. ringo keeps only the merge trigger, as an API call.

## Acceptance criteria

- `export` runs inside trailmap on the same hourly schedule, writing the same
  DB-owned fields and producing the same `state: sync` commits.
- The anti-ping-pong property is preserved and still covered by a test.
- The hourly `ingest`/`export` pair moves out of `webhook/tasksingest.go`.
- The post-merge fast-path ingest becomes an API call from ringo, keeping its
  current latency.
- Export never runs in a mutation's request path.
