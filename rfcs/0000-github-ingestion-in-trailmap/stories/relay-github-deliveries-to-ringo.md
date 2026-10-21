---
title: "trailmap: relay stored deliveries to ringo, in order, re-signed"
status: ready
updated: 2026-10-21
rfc: "0000-github-ingestion-in-trailmap"
cluster: null
packages: []
deps: [receive-and-store-github-deliveries, run-gh-webhook-forward-as-an-ingest-process]
deps-rfc: []
est-loc: 220
priority: null
pr: null
claim: null
assignee: null
blocked-by: null
closed-reason: null
---

**Lands in:** trailmap.

## Context

`lib/ringo-relay.ts`, run as a loop inside the `ingest` process, which is
**the only relayer**. The receiver never relays, so nothing races to claim
rows.

- It sends only while `relay_to_ringo` is `audit`. Rows stored while it was
  `off` (shadow) are never sent: ringo already acted on their direct twins.
  The first pass after a flip marks rows older than the flip's `Event` as
  `skipped`.
- Per repo, it takes the oldest `pending`/`failed` row by `(received_at, id)`
  and POSTs its raw body to `${Setting.ringoBase()}/webhooks/relay`, with
  `X-GitHub-Event`, `X-GitHub-Delivery` and an HMAC from `Setting`
  `ringo_webhook_secret`.
- A **2xx** marks it `relayed`.
- A **transient** failure (connection error, 5xx, 408, 429) marks it
  `failed`, increments `relay_attempts`, and retries with backoff, capped at
  5 minutes. It **blocks later rows for that repo**, and other repos carry on.
- A **permanent** rejection (any other 4xx) marks it `dead` with the response,
  and the repo moves on. Dead rows show on the deliveries page and are never
  retried automatically.
- It wakes every second. Latency target: p95 under 3 s from receipt to relay.

## Acceptance criteria

- [ ] With the mode `off`, nothing is sent
- [ ] Ringo's `verifySignature` accepts the relayed signature (fixture with a known secret)
- [ ] A ringo 5xx blocks that repo only, and it resumes in order once ringo is back
- [ ] A 400 marks the row `dead`, and the next row for that repo is sent
- [ ] Ties on `received_at` relay in `id` order
- [ ] Ringo's origin comes only from `Setting.ringoBase()`
