---
title: "Audit _available re-add sites that skip expire()"
status: in-progress
updated: 2026-06-05
rfc: "0005-activerecord-gaps"
cluster: connection-pool
deps: []
deps-rfc: []
est-loc: 25
priority: 22
pr: 2959
claim: "2026-06-05T18:54:59Z"
assignee: "pool-reap-flush-expire-audit"
blocked-by: null
---

## Context

The `clearReloadableConnections` double-lease fix expired connections before
re-adding to `_available`. Grep for other sites that re-add to `_available`
without expiring first and apply the same fix.

## Acceptance criteria

- [ ] All `_available` re-add sites audited
- [ ] Any site re-adding without `expire()` fixed to mirror the
      `clearReloadableConnections` pattern

## Notes

From the connection-pool gap plan (PF reap/flush), ready now.
