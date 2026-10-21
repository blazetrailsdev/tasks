---
title: "trailmap: receive GitHub deliveries at /webhooks/github and store them"
status: ready
updated: 2026-10-21
rfc: "0200-github-ingestion-in-trailmap"
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

**Lands in:** trailmap.

## Context

The front door. `gh webhook forward` POSTs GitHub's request as GitHub would:
`X-GitHub-Event`, `X-GitHub-Delivery`, `X-Hub-Signature-256` and a JSON body.

**First, check for framework gaps:** reading the raw request body, and skipping
the SSO viewer guard and CSRF for this one action. If either is missing, file
a trails story, add it to `deps-rfc`, and stop (trailmap CLAUDE.md).

Then add `post "webhooks/github"` and an action that:

- verifies `X-Hub-Signature-256` against `Setting` `github_webhook_secret`
  (constant-time; 403 on a bad or missing signature; never logs the body)
- answers `ping` with 200 `pong`
- stores a **`GithubDelivery`** (Hub; this story owns its migration):
  - `guid` (unique), `event`, `action`, `repo`
  - `received_at` (arrival), `occurred_at` (the event's own time from the
    payload, falling back to `received_at`)
  - `body` (the raw bytes as received), `audit_key` (`sha256(body)`)
  - `synthetic` (boolean, default false; true for catch-up rows)
  - `relay_status` (`pending` | `relayed` | `failed` | `dead` | `skipped`), `relay_attempts`,
    `relayed_at`, `relay_error`
- treats a repeated `guid` as success (200), without adding a row
- never relays. The `ingest` process does that.

## Acceptance criteria

- [ ] The framework-gap check is done, and any gap is filed as a trails story
- [ ] A valid signed POST stores one row; the same GUID again stores nothing and returns 200
- [ ] A bad, missing or wrong-secret signature returns 403 and stores nothing
- [ ] The stored body is byte-identical to the request (test with key order and whitespace a re-serialiser would change)
- [ ] Only this route bypasses the SSO guard and CSRF
