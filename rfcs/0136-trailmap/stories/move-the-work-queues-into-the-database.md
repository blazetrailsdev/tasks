---
title: "Move the three work queues into the database"
status: draft
updated: 2026-09-07
rfc: "0136-trailmap"
cluster: null
packages: ["activerecord"]
deps: ["establish-the-shared-sqlite-write-protocol"]
deps-rfc: []
est-loc: 250
priority: null
pr: null
claim: null
assignee: null
blocked-by: null
closed-reason: null
---

## Context

Three of ringo's JSON files are work queues: `pending-queue.json`,
`cleanup-queue.json` and `copilot-queue.json`. A queue as a rewritten-whole
JSON file is the shape most exposed to the half-written-file bug RFC 0136
already documents, because it is written most often and read by the thing that
drains it.

Phase B of RFC 0136.

## Acceptance criteria

- One table per queue, ringo-owned, migrated by trailmap, registered in the
  ownership table.
- Enqueue and drain are row operations. Draining must not rewrite the queue.
- Ordering semantics are preserved and tested — if a queue is FIFO today, prove
  it is FIFO after; if the ordering was incidental to map iteration, say so in
  the PR rather than silently fixing it.
- Backfill from the live JSON, idempotent.
- The JSON files are not deleted here; dual-write through one soak.
