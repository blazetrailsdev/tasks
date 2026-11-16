---
title: "Review the LIMIT 50 caps in stats sync and log when a run hits one"
status: done
updated: 2026-11-16
rfc: "0136-trailmap"
cluster: null
packages: []
deps: []
deps-rfc: []
est-loc: 60
priority: null
pr: trailmap#146
claim: "2026-11-16T18:51:46Z"
assignee: "ringo-api-sessions-honours-the-pr-filter"
blocked-by: null
closed-reason: null
---

## Context

`lib/stats-sync/sync.ts` caps several of its work queries at `LIMIT 50`. On the old nightly schedule, a backlog bigger than 50 took several days to drain. With hourly runs (trailmap#144) it drains faster, but the cap is still an unrecorded limit, and nothing logs when a run hits it.

## Acceptance criteria

- List every `LIMIT 50` in sync.ts and decide on each: raise it, page through, or keep it.
- When a run hits a cap, log a `[sync-stats]` line saying so.
