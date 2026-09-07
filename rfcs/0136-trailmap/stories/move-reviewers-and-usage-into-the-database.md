---
title: "Move reviewer config and usage accounting into the database"
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

Five JSON files hold reviewer assignment and model-usage accounting:
`reviewers.json`, `reviewer-config.json`, `usage-log.json`, `usage-state.json`
and `codex-usage-state.json`. `usage-log.json` is an append-only log kept as a
rewritten array, which is the worst fit of the thirteen — it grows without
bound and every append rewrites the whole file.

Phase B of RFC 0136.

## Acceptance criteria

- Tables for each, ringo-owned, migrated by trailmap, registered in the
  ownership table.
- `usage-log` becomes an append-only table with an index on whatever the usage
  pages actually query on. State the query, then add that index — not a guess.
- Reviewer config keeps its current precedence rules, with a test.
- Backfill is idempotent, and for `usage-log` it is bounded: say in the PR how
  large the live file is and how long the backfill takes.
- Dual-write through one soak; no deletions in this story.
