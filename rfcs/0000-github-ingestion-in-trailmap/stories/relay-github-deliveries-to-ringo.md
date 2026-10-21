---
title: "trailmap: relay stored deliveries to ringo, re-signed, behind a setting"
status: ready
updated: 2026-10-21
rfc: "0000-github-ingestion-in-trailmap"
cluster: null
packages: []
deps: [receive-and-store-github-deliveries]
deps-rfc: []
est-loc: 200
priority: null
pr: null
claim: null
assignee: null
blocked-by: null
closed-reason: null
---

## Context

Ringo's `Handler.ServeHTTP` (btwebooks `webhook/handler.go`) only checks the
HMAC and then routes on `X-GitHub-Event`. `injectDelivery`
(`webhook/pollingest.go`) already feeds it re-signed replays. A relay needs no
ringo change.

`lib/ringo-relay.ts`:

- POSTs the stored **raw body** to `${Setting.ringoBase()}/webhooks/github`
  with `X-GitHub-Event`, `X-GitHub-Delivery` (the stored GUID) and
  `X-Hub-Signature-256` computed with `RINGO_WEBHOOK_SECRET` (ringo's
  `WEBHOOK_SECRET`)
- marks the row `relayed`, or `failed` with the status and body excerpt
- runs only when the `relay_to_ringo` Setting is on (default off)

The receiver triggers a relay after it has answered. A sweep, run from the
`ingest` process on an interval, retries `pending` and `failed` rows oldest
first, with a bounded attempt count. Retries must stay in arrival order per
repo, so a `closed` event can't reach ringo before the `opened` event for the
same PR.

## Acceptance criteria

- [ ] With the setting off, nothing is sent and rows stay `pending`
- [ ] With it on, ringo accepts the relayed request: a test with a known secret checks the signature the way `verifySignature` does
- [ ] A ringo 5xx or connection failure leaves the row `failed`, and the sweep delivers it once ringo is back
- [ ] Rows are relayed in `received_at` order per repo, including on retry
- [ ] It doesn't resolve ringo's origin anywhere except `Setting.ringoBase()`
