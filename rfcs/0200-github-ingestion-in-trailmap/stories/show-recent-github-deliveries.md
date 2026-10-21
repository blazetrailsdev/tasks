---
title: "trailmap: deliveries page with counts, forwarder health and audit results"
status: ready
updated: 2026-10-21
rfc: "0200-github-ingestion-in-trailmap"
cluster: null
packages: [actionview]
deps:
  [
    store-ingest-configuration-in-activerecord,
    receive-and-store-github-deliveries,
    store-relay-audit-reports,
  ]
deps-rfc: []
est-loc: 160
priority: null
pr: null
claim: null
assignee: null
blocked-by: null
closed-reason: null
---

**Lands in:** trailmap.

## Context

This is the one page where an operator sees whether ingestion is healthy.
It's behind SSO, with a `.json` twin.

- recent `GithubDelivery` rows: received_at, repo, event, action,
  relay_status, relay_error; `dead` rows are listed separately
- counts by repo × event over a selectable window (default 24 h), which is
  Verification 1's query
- an `IngestForwarder` row per repo: connected, last event, restarts, last exit
- per-repo relay lag, with the alert once a repo has been blocked for more than 15 minutes
- `RelayAudit`: misses (newest first) and the latest tallies

## Acceptance criteria

- [ ] The page and its JSON show deliveries, counts by repo × event for a window, forwarder health, relay lag/alerts and audit misses/tallies
- [ ] The count table matches Verification 1's SQL for the same window
