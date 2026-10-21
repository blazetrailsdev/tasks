---
title: "trailmap: run gh webhook forward per tracked repo as an `ingest` process"
status: ready
updated: 2026-10-21
rfc: "0000-github-ingestion-in-trailmap"
cluster: null
packages: []
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

## Context

This is what makes ingestion need no public hostname. `gh webhook forward
--repo=<r> --events=<list> --url=<u> --secret=<s>` creates a temporary dev
hook and streams that repo's events over an outbound websocket.

- **Dockerfile (runtime stage):** install `gh` from GitHub's apt repo, and as
  user `node` run `gh extension install cli/gh-webhook`. Pin the extension to a
  tag so builds are reproducible.
- **`bin/ingest-github`:** a small Node supervisor that:
  - boots the app's Hub connection and **reconciles from the table**: one
    forwarder per `RepositorySetting` with `ingest_enabled`, using that row's
    `ingest_events`. It re-reads on an interval and starts or stops forwarders
    to match, so enabling a repo is a settings-page click, not a redeploy.
  - passes `Setting` `github_token` to each `gh` child as `GH_TOKEN`, and
    `github_webhook_secret` as `--secret`
  - posts to `http://trailmap.web:8080/webhooks/github`
  - keeps an **`IngestForwarder` row per repo** (new Hub model): pid,
    started_at, connected_at, last_event_at, restarts, last exit code, stderr
    tail. This row, not log lines, is where a forwarder's health is read. Show
    it on the deliveries page.
  - restarts a forwarder that exits, with capped exponential backoff, and
    records each exit on its row
  - before each spawn, deletes a leftover dev hook from a crashed run if
    `gh webhook forward` refuses to start because one exists (check this
    behaviour first and record what you find in the RFC)
  - stops its children on SIGTERM, so the dev hooks are removed
- **Procfile:** `ingest: bin/ingest-github`.
- **dokku:** no new env vars; the token, secret and repo set are rows (see
  `store-ingest-configuration-in-activerecord`). `ps:scale trailmap ingest=1`. The `ingest` container must be on the `fleet`
  network to reach `trailmap.web`.

## Acceptance criteria

- [ ] The image has `gh` and the extension (`gh webhook forward --help` works as user `node`)
- [ ] With `ingest=1`, opening a PR on a tracked repo produces `GithubDelivery` rows within seconds
- [ ] Killing one forwarder's process restarts it, and the other repos keep ingesting
- [ ] Turning `ingest_enabled` on or off for a repo starts or stops its forwarder within one reconcile interval, with no redeploy
- [ ] Each forwarder's `IngestForwarder` row shows its pid, connect time, last event and restarts
- [ ] A redeploy (SIGTERM) leaves no dev hooks behind on the three repos (`gh api repos/<r>/hooks`)
- [ ] README deploy notes say that only one forwarder per repo can run, so a local `gh webhook forward` collides with production
