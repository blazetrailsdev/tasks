---
title: "Verify node:sqlite restoreFromPath on a Node 22.5+ CI lane"
status: ready
updated: 2026-07-07
rfc: "0005-activerecord-gaps"
cluster: connection-pool
deps: []
deps-rfc: []
est-loc: 20
priority: 40
pr: null
claim: null
assignee: null
blocked-by: null
---

## Context

The `node:sqlite restoreFromPath` implementation exists but is unverified. Add a
Node 22.5+ CI lane and confirm behavior.

## Acceptance criteria

- [ ] Node 22.5+ CI lane added
- [ ] `node:sqlite restoreFromPath` verified on that lane

## Notes

From the connection-pool gap plan (PF node-sqlite). Blocked on adding the CI lane.
