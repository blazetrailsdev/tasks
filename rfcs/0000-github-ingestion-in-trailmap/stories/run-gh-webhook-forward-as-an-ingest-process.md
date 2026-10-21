---
title: "trailmap: run gh webhook forward per enabled repo as an `ingest` process"
status: ready
updated: 2026-10-21
rfc: "0000-github-ingestion-in-trailmap"
cluster: null
packages: [trailties]
deps: [store-ingest-configuration-in-activerecord, receive-and-store-github-deliveries]
deps-rfc: []
est-loc: 200
priority: null
pr: null
claim: null
assignee: null
blocked-by: null
closed-reason: null
---

**Lands in:** trailmap.

## Context

- **Dockerfile (runtime stage):** install `gh` from GitHub's apt repo, and as
  `node`, run `gh extension install cli/gh-webhook` pinned to a tag.
- **`bin/ingest-github`:** a Node supervisor that boots the Hub connection and:
  - **reconciles from the table:** one `gh webhook forward
--repo=<r> --events=<ingest_events> --url=http://trailmap.web:8080/webhooks/github`
    per `RepositorySetting` with `ingest_enabled`, re-read on an interval
  - passes `Setting` `github_token` as `GH_TOKEN` and `github_webhook_secret`
    as `--secret`
  - keeps the repo's `IngestForwarder` row current (that model comes from the
    configuration story)
  - restarts a forwarder that exits, with capped backoff, and records each exit
  - before spawning, clears a leftover dev hook if `gh webhook forward` refuses
    to start because of one. Check this behaviour first and record the answer
    under the RFC's open question 2.
  - stops its children on SIGTERM, so their dev hooks are removed
  - hosts the relay loop (`relay-github-deliveries-to-ringo`) once that lands
- **Procfile:** `ingest: bin/ingest-github`. **dokku:** `ps:scale trailmap ingest=1`,
  with no new env vars. The container must be on the `fleet` network.

## Acceptance criteria

- [ ] The image has `gh` and the extension (`gh webhook forward --help` works as `node`)
- [ ] With `ingest=1`, opening a PR on an enabled repo produces `GithubDelivery` rows within seconds
- [ ] Toggling `ingest_enabled` starts or stops that repo's forwarder within one reconcile interval, with no redeploy
- [ ] Killing one forwarder restarts it, the other repos keep ingesting, and `IngestForwarder` shows the restart
- [ ] A redeploy leaves no dev hooks behind (`gh api repos/<r>/hooks`)
- [ ] The README notes that a local `gh webhook forward` on a tracked repo collides with production
