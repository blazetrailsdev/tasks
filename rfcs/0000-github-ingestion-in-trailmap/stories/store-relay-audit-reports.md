---
title: "trailmap: accept ringo's audit reports at /webhooks/audit"
status: ready
updated: 2026-10-21
rfc: "0000-github-ingestion-in-trailmap"
cluster: null
packages: [actionpack]
deps: [store-ingest-configuration-in-activerecord, receive-and-store-github-deliveries]
deps-rfc: []
est-loc: 100
priority: null
pr: null
claim: null
assignee: null
blocked-by: null
closed-reason: null
---

**Lands in:** trailmap.

## Context

Ringo audits the relay (see the RFC's "Ringo audits the relay"), but the
results belong in trailmap's database. `post "webhooks/audit"` takes a JSON
body signed with `ringo_webhook_secret` (the same check as the receiver, on the
fleet network only):

- `{kind: "miss", repo, event, audit_key, detail}` stores a `RelayAudit` miss
- `{kind: "tally", repo, event, window_start, window_end, matched, unmatched, duplicates}`
  stores a tally

## Acceptance criteria

- [ ] Signed reports are stored as `RelayAudit` rows; unsigned or wrongly signed reports return 403
- [ ] A repeated report (same kind, repo, event, key or window) is stored once
