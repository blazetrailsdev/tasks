---
title: "Establish the shared-SQLite write protocol: one writer per table"
status: draft
updated: 2026-09-07
rfc: "0136-trailmap"
cluster: null
packages: ["activerecord"]
deps: []
deps-rfc: []
est-loc: 200
priority: null
pr: null
claim: null
assignee: null
blocked-by: null
closed-reason: null
---

## Context

RFC 0136's phase B moves ringo's thirteen JSON state files into trailmap's
database, and ringo writes its own tables directly rather than through the API.
That is deliberate — it keeps the webhook hot path off trails on day one — but
it means two processes hold write handles on one SQLite file, which is the
arrangement the RFC's motivation section blames for a documented class of bugs.

The reconciliation is **sole writer per table, not per file**. The task-domain
tables (`rfcs`, `stories`, `events`, deps, packages) stay trailmap-only. The
fleet-state tables are ringo-owned and trailmap only reads them. No table has
two writers, which is what the original rule was actually protecting.

That is a rule, and a rule with nothing enforcing it is a convention — exactly
what `webhook/tasksdb.go`'s header admitted about reproducing `readmodel.ts`
"by convention, with nothing enforcing it". This story builds the enforcement
before any data moves.

## Acceptance criteria

- WAL mode and a `busy_timeout` on both processes' connections, with the values
  stated and justified in one place rather than set twice.
- A written table-ownership table: every table, its owning process, and whether
  the other process may read it. It lives in trailmap's docs, not in a comment.
- Migrations stay trailmap-owned for every table, including ringo's — one
  schema authority, so a fleet-state column is added the same way a story
  column is.
- A check that fails if ringo writes a trailmap-owned table or vice versa.
  A test-time assertion is acceptable; silence is not.
- A documented answer to what ringo does when the database is locked or
  migrating: the webhook ingest must not drop an event because trailmap is
  redeploying.
- No data moves in this story. It is the floor the five migration stories stand
  on, and each of them depends on it.
