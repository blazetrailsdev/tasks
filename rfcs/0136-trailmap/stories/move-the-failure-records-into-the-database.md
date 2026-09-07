---
title: "Move the CI-failure and pull-failure records into the database"
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

`main-ci-failures.json`, `pull-failures.json` and `ci-fixer-state.json` hold
the fleet's failure bookkeeping — which main-CI runs are red, which pulls
failed, and what the CI fixer is doing about them. They drive spawns, so a
stale or half-read file spawns the wrong agent or none at all.

Phase B of RFC 0136. These three move together because the CI fixer reads all
of them.

## Acceptance criteria

- One table per file, ringo-owned, migrated by trailmap, registered in the
  ownership table.
- The CI fixer's state machine is unchanged in behaviour; its transitions are
  covered by tests before the move, so the move is provably behaviour-
  preserving rather than hopefully so.
- Backfill from the live JSON, idempotent.
- Dual-write through one soak; no deletions in this story.
- Any spawn decision that currently depends on file mtime rather than a field
  is called out in the PR — mtime does not survive the move.
