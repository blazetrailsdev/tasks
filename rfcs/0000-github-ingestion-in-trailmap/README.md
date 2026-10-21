---
rfc: "0000-github-ingestion-in-trailmap"
title: "trailmap ingests GitHub events and relays them to ringo"
status: draft
created: 2026-10-21
updated: 2026-10-21
owner: "@deanmarano"
packages:
  - actionpack
  - actionview
  - activerecord
  - trailties
clusters: []
related-rfcs:
  - "0136-trailmap"
---

# RFC 0000: trailmap ingests GitHub events and relays them to ringo

## Summary

trailmap takes over receiving GitHub events from ringo. A process in the
trailmap app runs `gh webhook forward`
([cli/gh-webhook](https://github.com/cli/gh-webhook)) once per tracked repo.
That command opens an **outbound** websocket to GitHub and POSTs each event
to trailmap. trailmap verifies each event, stores it, and relays it, re-signed,
to ringo's existing `/webhooks/github`. Once a shadow period shows trailmap
sees what ringo's hooks see, ringo's three public repo hooks are switched off
in the same step as the relay is switched on.

Ringo's handlers are not ported here. This RFC only moves the front door, so
later stories can move handlers into trailmap one at a time behind it.

## Motivation

- **The public hook is what makes ringo hard to share.** Every event arrives at
  `https://btwhooks.deanoftech.com/webhooks/github`, which needs a public
  hostname, TLS, an SSO bypass for that route and a host GitHub can reach.
  `gh webhook forward` needs only a `gh` login and outbound HTTPS.
- **Ringo's functionality is moving into trailmap** (RFC 0136). Ingestion is
  the entry point for everything downstream, so trailmap should own it. A
  stored, queryable delivery log is also something ringo never had: today an
  event that ringo mishandled exists only in GitHub's 3-day delivery history.
- **Ringo already has a stopgap for an unreachable host.** `POLL_INGEST_WEBHOOKS`
  (`webhook/pollingest.go`) pulls failed deliveries and replays them through
  `ServeHTTP`. It's off today (`POLL_INGEST_WEBHOOKS=0`), and it still depends
  on a hook that points at ringo.

## Facts the design rests on

- Ringo's hooks, all active, all pointing at `btwhooks.deanoftech.com`:

  | repo                    | hook      | events                                                                                        |
  | ----------------------- | --------- | --------------------------------------------------------------------------------------------- |
  | blazetrailsdev/trails   | 602873770 | check_run, pull_request, pull_request_review, pull_request_review_comment, push, workflow_run |
  | blazetrailsdev/tasks    | 670781774 | check_run, pull_request, pull_request_review, push, workflow_run                              |
  | blazetrailsdev/trailmap | 674688087 | check_run, pull_request, pull_request_review, pull_request_review_comment, push, workflow_run |

- `Handler.ServeHTTP` (btwebooks `webhook/handler.go`) checks only
  `X-Hub-Signature-256` against `WEBHOOK_SECRET`, then routes on
  `X-GitHub-Event`. `injectDelivery` (`webhook/pollingest.go`) already replays
  payloads by re-signing them. **A relay that POSTs the raw body with a fresh
  HMAC needs no ringo change.**
- trailmap reaches ringo on the dokku `fleet` network at `RINGO_BASE`
  (`http://btwhooks.web:8080`), resolved only through `Setting.ringoBase()`.
  The relay uses that resolver.
- The trailmap image has no `gh`, and trails has no job or runner system. The
  ingest process is a plain Procfile process type.
- The deploy token has `repo` scope, which can create repo hooks, but not
  `admin:org_hook`. Forwarders are per repo, not `--org`. The initial repo set
  is ringo's `TRACKED_REPOS`, seeded into `RepositorySetting` rows (see
  "Configuration and state live in ActiveRecord").
- `gh webhook forward` flags: `--repo`/`--org`, `--events` (or `*`), `--url`,
  `--secret`, `--github-host`. With no `--url` it prints to stdout.

## Design

```text
GitHub ──websocket──▶ gh webhook forward    (trailmap `ingest` process, one per repo)
                         │ POST, signed with Setting github_webhook_secret
                         ▼
                      trailmap.web:8080/webhooks/github
                         ├─ verify HMAC; 200 "pong" on ping
                         ├─ store GithubDelivery (Hub/Postgres, raw body, GUID-unique)
                         └─ if relay_to_ringo: POST raw body, re-signed with
                            Setting ringo_webhook_secret, to Setting.ringoBase()/webhooks/github
```

- **Raw bytes are stored and relayed.** Signatures are computed over bytes, so
  re-serialising JSON would be a bug class of its own.
- **Answer GitHub/forwarder first, relay after.** A slow or redeploying ringo
  must not stall ingestion. A sweep retries rows left `pending` or `failed`,
  oldest first, so a ringo redeploy delays events instead of dropping them.
- **The relay is a Setting** (`relay_to_ringo`, default off), so the cutover is
  a row flip, not a deploy.
- **Postgres (Hub) holds the deliveries.** This is high-volume, append-only
  fleet data, not the task domain's SQLite.

## Configuration and state live in ActiveRecord

Ringo keeps its configuration in env vars (`TRACKED_REPOS`, `WEBHOOK_SECRET`,
`WEBHOOK_URL_SUBSTRING`, `POLL_INGEST_*`) and its state in JSON files
(`pollingest-cursors.json` and its siblings). An env var can't be per-repo,
can't be shown on a page, and can't change without a redeploy. A file is
invisible, and it's lost when a container's filesystem is. This RFC doesn't
carry that over. **Everything the ingest path reads or remembers is a Hub
row**, behind a model and shown on a page. The environment holds only what a
process needs before it can reach the database.

| What                                                                           | Where                                                                                                                                  | Was (ringo)                                              |
| ------------------------------------------------------------------------------ | -------------------------------------------------------------------------------------------------------------------------------------- | -------------------------------------------------------- |
| Which repos ingest, and which events                                           | `RepositorySetting` columns `ingest_enabled` and `ingest_events` (one row per `Repository`, already shown at `/:owner/:repo/settings`) | `TRACKED_REPOS` env, events fixed in each GitHub hook    |
| The ringo hook id kept for cutover and rollback                                | `RepositorySetting.ringo_hook_id`                                                                                                      | found at runtime by `WEBHOOK_URL_SUBSTRING`              |
| Inbound and relay signing secrets                                              | `Setting` keys `github_webhook_secret` and `ringo_webhook_secret`, values `encrypts`-ed; env fallback per `Setting.FALLBACKS`          | `WEBHOOK_SECRET` env                                     |
| The GitHub token the forwarders use                                            | `Setting` key `github_token`, encrypted; the supervisor passes it to each `gh` child as `GH_TOKEN`; env fallback                       | `gh auth` on the host                                    |
| Relay on/off                                                                   | `Setting` key `relay_to_ringo`                                                                                                         | n/a (`POLL_INGEST_WEBHOOKS` env, the closest equivalent) |
| Each forwarder's life (started, connected, last event, exit code, stderr tail) | `IngestForwarder` row per repo, updated by the supervisor                                                                              | log lines only                                           |
| Catch-up cursor (last delivery seen per repo)                                  | the newest `GithubDelivery.received_at` per repo, derived from the deliveries themselves                                               | `pollingest-cursors.json`                                |
| Cutover state and history                                                      | `Setting` `relay_to_ringo` plus an `Event` row per flip (verb `ingest-cutover`)                                                        | n/a                                                      |

Env vars that remain: the database URLs (`HUB_DATABASE_URL`), the AR
encryption key material, and fallbacks during migration. A fallback is read
only when no row is written, so each value moves into the table without a
redeploy, as `Setting` already documents for `ringo_base`.

**The supervisor reconciles from the table.** It re-reads `RepositorySetting`
on an interval and starts or stops forwarders to match. Turning a repo's
ingestion on or off is a settings-page click, not a config change and redeploy.

Encryption at rest uses ActiveRecord's `encrypts`, which exists in the vendored
build. If anything it needs is missing for a Hub model, that gap is a trails
story, and until it lands the secret stays in its env fallback. Plaintext rows
are not an acceptable stopgap.

## Rollout

1. **Shadow.** Ingest and store with the relay off, while ringo still gets its
   direct hooks. Compare trailmap's counts by repo × event with each ringo
   hook's `/deliveries` over the same window, and spot-check PR numbers and
   head SHAs. Delivery GUIDs differ between the two hooks, so rows can't be
   matched by GUID.
2. **Cutover, as one step.** Turn `relay_to_ringo` on and PATCH the three
   hooks to `active: false` together. If both are on at once, every spawn,
   reassign and teardown fires twice: GUIDs differ, so ringo can't dedupe.
   Keep the hooks rather than deleting them; reactivating them plus relay
   off is the rollback.
3. **Cleanup.** Delete the hooks, and remove ringo's redelivery poller and
   poll-ingest, which find hooks by `WEBHOOK_URL_SUBSTRING`.

## Risks

- **GitHub calls `gh webhook forward` a development tool.** There is no SLA,
  and nothing is queued while the forwarder is disconnected. A catch-up story
  backfills the gap on reconnect.
- **A crashed forwarder may leave its dev hook behind** and refuse to start
  the next time. The supervisor clears stale dev hooks before spawning. Check
  this behaviour first.
- **One forwarder per repo.** A second forwarder (someone testing locally
  against the same repo) would collide with production. The README says so.

## Non-goals

- Porting any ringo handler (reviews relay, spawn, CI-fixer, merge teardown).
- Org-level forwarding, which needs `admin:org_hook`.
- Ingesting repos ringo doesn't already track.
