---
title: "Move deploys.json and mergesweeps.json into the database"
status: draft
updated: 2026-09-07
rfc: "0136-trailmap"
cluster: null
packages: ["activerecord"]
deps: ["establish-the-shared-sqlite-write-protocol"]
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

`deploys.json` and `mergesweeps.json` are the last two of ringo's thirteen
state files. They back `/deploys` and the merge-sweep cron, and moving them is
what lets `serve-the-deploys-page` read from models rather than re-reading
ringo's file from a second process.

Phase B of RFC 0136.

## Acceptance criteria

- Tables for both, ringo-owned, migrated by trailmap, registered in the
  ownership table.
- `serve-the-deploys-page` is updated to read the table; if that story has not
  landed yet, note the dependency in its body rather than leaving it to be
  rediscovered.
- Backfill is idempotent.
- Dual-write through one soak; no deletions in this story.
- With this story done, every one of the thirteen JSON state files has a table.
  A follow-up story — not this one — deletes the files after their soaks pass.
