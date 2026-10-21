---
title: "ringo: delete the GitHub hooks, the redelivery poller and poll-ingest"
status: ready
updated: 2026-10-21
rfc: "0000-github-ingestion-in-trailmap"
cluster: null
packages: []
deps: [cut-ringo-over-to-the-trailmap-relay]
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

Once the relay has been the only path for a while, ringo's hook-shaped
machinery is dead weight, and it would keep calling GitHub for hooks that do
nothing.

In btwebooks:

- remove `StartRedeliveryPoller` (`webhook/redelivery.go`) and
  `StartDeliveryPollIngest` (`webhook/pollingest.go`) and their wiring in
  `main.go`
- drop `WEBHOOK_URL_SUBSTRING`, `POLL_INGEST_WEBHOOKS` and
  `POLL_INGEST_INTERVAL` from config
- delete the three repo hooks, unless the catch-up story chose an inactive
  hook as its backfill source; in that case keep exactly those hooks
- remove the public route and SSO bypass for `btwhooks.deanoftech.com/webhooks/github`,
  leaving `/webhooks/github` reachable only on the `fleet` network

## Acceptance criteria

- [ ] ringo builds and its tests pass without the pollers
- [ ] No hook on the three repos points at btwhooks, apart from any the catch-up story kept
- [ ] `https://btwhooks.deanoftech.com/webhooks/github` no longer answers from outside, and relayed events still arrive
