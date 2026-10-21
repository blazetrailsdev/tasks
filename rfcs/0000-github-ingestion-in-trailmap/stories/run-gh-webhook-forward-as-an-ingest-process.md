---
title: "trailmap: run gh webhook forward per tracked repo as an `ingest` process"
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

This is what makes ingestion need no public hostname. `gh webhook forward
--repo=<r> --events=<list> --url=<u> --secret=<s>` creates a temporary dev
hook and streams that repo's events over an outbound websocket.

- **Dockerfile (runtime stage):** install `gh` from GitHub's apt repo, and as
  user `node` run `gh extension install cli/gh-webhook`. Pin the extension to a
  tag so builds are reproducible.
- **`bin/ingest-github`:** a small Node supervisor that:
  - spawns one forwarder per entry in `INGEST_REPOS` (comma-separated
    `owner/repo`; set it to ringo's `TRACKED_REPOS`), with the event list from
    the RFC's table (tasks has no `pull_request_review_comment`)
  - posts to `http://trailmap.web:8080/webhooks/github` (overridable)
  - restarts a forwarder that exits, with capped exponential backoff, and logs
    every exit with its code and stderr tail
  - before each spawn, deletes a leftover dev hook from a crashed run if
    `gh webhook forward` refuses to start because one exists (check this
    behaviour first and record what you find in the RFC)
  - stops its children on SIGTERM, so the dev hooks are removed
- **Procfile:** `ingest: bin/ingest-github`.
- **dokku:** set `GH_TOKEN`, `GITHUB_WEBHOOK_SECRET` and `INGEST_REPOS`, then
  `ps:scale trailmap ingest=1`. The `ingest` container must be on the `fleet`
  network to reach `trailmap.web`.

## Acceptance criteria

- [ ] The image has `gh` and the extension (`gh webhook forward --help` works as user `node`)
- [ ] With `ingest=1`, opening a PR on a tracked repo produces `GithubDelivery` rows within seconds
- [ ] Killing one forwarder's process restarts it, and the other repos keep ingesting
- [ ] A redeploy (SIGTERM) leaves no dev hooks behind on the three repos (`gh api repos/<r>/hooks`)
- [ ] README deploy notes say that only one forwarder per repo can run, so a local `gh webhook forward` collides with production
