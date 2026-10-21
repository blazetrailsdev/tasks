---
title: "trailmap: backfill deliveries missed while a forwarder was disconnected"
status: ready
updated: 2026-10-21
rfc: "0000-github-ingestion-in-trailmap"
cluster: null
packages: []
deps: [run-gh-webhook-forward-as-an-ingest-process]
deps-rfc: []
est-loc: 150
priority: null
pr: null
claim: null
assignee: null
blocked-by: null
closed-reason: null
---

## Context

GitHub queues nothing for a dev hook while its websocket is down: during a
deploy, a crash-restart or a network blip. Without a backfill, an event in
that gap is gone, and a lost `pull_request closed` means a pane that never
gets torn down.

Pick a backfill source, check that it works, and record the choice in the RFC:

- a **persistent, inactive repo hook** whose delivery history GitHub keeps
  for ~3 days (`GET repos/<r>/hooks/<id>/deliveries`, then the payload by ID,
  as ringo's `injectDelivery` does). Check whether an inactive hook still
  records deliveries before relying on it.
- the **REST state** (`pulls?state=all&sort=updated`, check-runs and workflow
  runs since the last `received_at`), turned into synthetic deliveries. This
  is lossy, so mark those rows `synthetic`.

When a forwarder (re)connects, the supervisor backfills from the repo's last
`received_at` up to now, skipping anything already stored.

## Acceptance criteria

- [ ] The source is chosen, with the evidence in the RFC
- [ ] Stopping `ingest` for a few minutes while a PR is opened and closed leaves both events in `GithubDelivery` after restart
- [ ] The backfill never duplicates a row that the live forwarder already stored
