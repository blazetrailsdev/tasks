---
title: "trailmap: receive GitHub deliveries at /webhooks/github and store them"
status: ready
updated: 2026-10-21
rfc: "0000-github-ingestion-in-trailmap"
cluster: null
packages: [actionpack, activerecord]
deps: [store-ingest-configuration-in-activerecord]
deps-rfc: []
est-loc: 250
priority: null
pr: null
claim: null
assignee: null
blocked-by: null
closed-reason: null
---

## Context

The front door the rest of the RFC hangs off. `gh webhook forward` (and,
later, anything else) POSTs GitHub's request to trailmap exactly as GitHub
would send it: `X-GitHub-Event`, `X-GitHub-Delivery`, `X-Hub-Signature-256`,
and a JSON body.

Add `post "webhooks/github"` and a controller action that:

- verifies `X-Hub-Signature-256` against `Setting` `github_webhook_secret` (constant-time;
  403 on a bad or missing signature, never logging the body)
- answers `ping` with 200 `pong`
- stores a `GithubDelivery` on **Hub** (Postgres): `guid` (unique), `event`,
  `action`, `repo` (`repository.full_name`), `received_at`, `body` (the raw
  request bytes as received; signatures are over bytes, so do not store
  re-serialised JSON), `relay_status` (`pending`), `relayed_at`, `relay_error`
- treats a repeated `guid` as success (200) without a second row

The route is called service to service on the `fleet` network, not by a
browser. It must not hit the SSO viewer guard or CSRF. If skipping either one
for a single action needs framework support that trails lacks, that's a trails
story, not a local workaround (trailmap CLAUDE.md). The same goes for reading
the raw request body.

## Acceptance criteria

- [ ] Hub migration + `GithubDelivery` model, unique index on `guid`
- [ ] A valid signed POST stores one row; the same GUID again stores nothing and returns 200
- [ ] A bad, missing or wrong-secret signature returns 403 and stores nothing
- [ ] `ping` returns 200 `pong`
- [ ] The stored body is byte-identical to the request body (test with a payload whose key order and whitespace a re-serialiser would change)
- [ ] The route bypasses the SSO guard and CSRF, and no other route does
