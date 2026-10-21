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
to ringo, which runs its existing handler on it. Ringo then acts only on
relayed events, and **audits** them against its own still-active hooks: a
direct delivery that never arrives through the relay is a miss, which ringo
heals and reports. Ringo's three public repo hooks are deleted only after a
week with zero misses.

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
- **The relay mode is a Setting** (`relay_to_ringo`: `off` or `audit`, default
  `off`), read by both apps, so the cutover is a row flip, not a deploy.
- **One relayer, strict per-repo order.** Only the `ingest` process relays.
  The receiver never does, so there is no race to claim rows. Order within a
  repo is `(received_at, id)`. A row that fails transiently (connection error,
  5xx, 408, 429) blocks later rows for that repo and is retried with backoff,
  and an alert shows on the deliveries page after 15 minutes. A permanent
  rejection (any other 4xx) is a poison event: it's parked as `dead`, shown
  on the page, and skipped, so one bad payload can't stall a repo.
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
| Relay mode (`off`, `audit`), read by trailmap and by ringo                     | `Setting` key `relay_to_ringo`                                                                                                         | n/a (`POLL_INGEST_WEBHOOKS` env, the closest equivalent) |
| Audit results (misses, matched/unmatched tallies)                              | `RelayAudit` rows, written through `/webhooks/audit`                                                                                   | n/a                                                      |
| Each forwarder's life (started, connected, last event, exit code, stderr tail) | `IngestForwarder` row per repo, updated by the supervisor                                                                              | log lines only                                           |
| Catch-up cursor (last event seen per repo)                                     | the newest `GithubDelivery.occurred_at` (event time, not arrival time) per repo, derived from the deliveries                           | `pollingest-cursors.json`                                |
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

## Ringo audits the relay

Cutting straight over would trust the forwarder before anything has measured
it. Instead, **ringo keeps its direct hooks active and uses them as an audit
stream** while it acts only on what trailmap relays:

- The relay POSTs to a new ringo path, `/webhooks/relay`, which runs the same
  handler as `/webhooks/github`. Ringo can tell the two sources apart by path.
  The secret is shared, so a forged relay needs the same secret a forged
  delivery does.
- Ringo reads its **mode** from trailmap (`GET /settings/relay_to_ringo` on the
  fleet network), not from an env var, so one row decides the mode:
  - `off` (shadow): act on direct deliveries and ignore the relay.
  - `audit`: act on the relay and treat each direct delivery as a receipt.
- **Matching.** Each delivery gets an audit key, `sha256(body)`, matched across
  both sources. If shadow shows that `gh webhook forward` changes body bytes, the
  fallback key is `event + action + repo + subject id + updated_at`, where the
  subject id is the PR number, check_run id, workflow_run id or push `after`.
  This is open question 1.
- **A miss is healed, not just counted.** A direct delivery with no matching
  relay after a 10-minute grace window is a miss. Ringo acts on the direct
  copy itself, so nothing is dropped while trailmap is being proven, and it
  reports the miss to trailmap.
- **Results live in trailmap's database.** Ringo POSTs each miss, plus a
  matched/unmatched tally per repo × event every 5 minutes, to
  `/webhooks/audit` (signed like the relay). They're stored as `RelayAudit`
  rows and shown on the deliveries page. Ringo keeps only the in-memory grace
  window, with no files.

This turns the cutover from a leap into a measurement. Turning the hooks off is
gated on a run of days with zero misses.

## Where each story lands

| Story                                         | Repo                           | Notes                                                                                           |
| --------------------------------------------- | ------------------------------ | ----------------------------------------------------------------------------------------------- |
| `store-ingest-configuration-in-activerecord`  | trailmap                       | Hub migrations for `Setting` keys, `RepositorySetting` columns, `IngestForwarder`, `RelayAudit` |
| `receive-and-store-github-deliveries`         | trailmap                       | `GithubDelivery` migration                                                                      |
| `run-gh-webhook-forward-as-an-ingest-process` | trailmap                       | Dockerfile, Procfile, supervisor                                                                |
| `show-recent-github-deliveries`               | trailmap                       | deliveries, forwarder health, audit results                                                     |
| `relay-github-deliveries-to-ringo`            | trailmap                       |                                                                                                 |
| `store-relay-audit-reports`                   | trailmap                       | `/webhooks/audit`                                                                               |
| `ringo-audits-direct-hooks-against-the-relay` | **btwebooks**                  | `/webhooks/relay`, mode from trailmap, matcher, heal, reports                                   |
| `catch-up-missed-deliveries-on-reconnect`     | trailmap                       |                                                                                                 |
| `cut-ringo-over-to-the-trailmap-relay`        | trailmap                       | a `trails` task, not a shell script                                                             |
| `delete-ringo-github-hooks-and-poll-ingest`   | **btwebooks** + GitHub + dokku |                                                                                                 |

Story `packages:` name the trails packages a story is expected to exercise. The
RFC's list is their union. **No trails framework stories are known to be
needed.** The receive story's first step is checking three possible gaps:
reading the raw request body, skipping the SSO guard and CSRF for one action,
and `encrypts` on a Hub model. A gap found there becomes a trails story, added
to that story's `deps-rfc` before work continues, per trailmap's CLAUDE.md.

## Alternatives considered

- **A public webhook endpoint on trailmap.** It moves ringo's problem
  instead of removing it: a public hostname, TLS and an SSO bypass, now on a
  second app.
- **One org-level hook / `gh webhook forward --org`.** It needs
  `admin:org_hook`, which the token doesn't have, and it would ingest every
  repo in the org rather than the tracked set. It could be revisited if the
  scope is granted; per-repo rows already model the set.
- **Poll-only (REST state, or hook delivery history).** It needs no forwarder,
  but every event waits up to an interval, and the polling cost competes with
  the rest of the fleet's REST quota (ringo already caps poll-ingest at half).
  It's kept as the catch-up mechanism, not the main path.
- **Cut straight over without an audit.** It's simpler, but the forwarder's
  loss rate would be unmeasured until a stranded pane showed it.
- **An inactive hook as the backfill source.** Rejected: an inactive hook
  receives no deliveries, so it has no history to backfill from, and the
  hooks are deleted at the end anyway.

## Rollout

1. **Foundations:** `store-ingest-configuration-in-activerecord`,
   `receive-and-store-github-deliveries`.
2. **Shadow** (`relay_to_ringo=off`; ringo acts on its direct hooks):
   `run-gh-webhook-forward-as-an-ingest-process`,
   `show-recent-github-deliveries`, `relay-github-deliveries-to-ringo` (built,
   but sending nothing), `store-relay-audit-reports`,
   `ringo-audits-direct-hooks-against-the-relay`,
   `catch-up-missed-deliveries-on-reconnect`.
3. **Audit** (`relay_to_ringo=audit`; ringo acts on the relay, and the direct
   hooks are receipts): `cut-ringo-over-to-the-trailmap-relay`. Rollback: set it
   to `off`.
4. **Hooks off and cleanup:** `delete-ringo-github-hooks-and-poll-ingest`,
   gated on Verification 2.

## Verification

1. **Shadow parity:** over 24 h, trailmap's `GithubDelivery` counts per
   repo × event are within **1%** of each ringo hook's `/deliveries` for the same
   window, and **every** `pull_request` `closed` and `opened` event appears in
   both. The comparison:

   ```sql
   SELECT repo, event, count(*) FROM github_deliveries
   WHERE received_at >= now() - interval '24 hours'
   GROUP BY repo, event ORDER BY repo, event;
   ```

   against `gh api --paginate repos/<r>/hooks/<ringo_hook_id>/deliveries`,
   filtered to `delivered_at` in the same window and grouped by `event`.

2. **Audit:** **7 consecutive days with zero `RelayAudit` misses** across all
   ingesting repos, including at least one trailmap deploy and one ringo deploy
   in that window. Also **zero events handled twice**: the summed
   `RelayAudit.duplicates` over the same 7 days is 0.
3. **After hooks off:** the three repos have no hook pointing at btwhooks, and
   `https://btwhooks.deanoftech.com/webhooks/github` doesn't answer from
   outside.

## Risks

- **GitHub calls `gh webhook forward` a development tool.** There's no SLA,
  and nothing is queued while it's disconnected. The audit phase measures
  this, ringo heals misses during it, and catch-up covers it afterwards.
- **A crashed forwarder may leave its dev hook behind** and refuse to start
  the next time. The supervisor clears stale dev hooks before spawning.
- **One forwarder per repo.** A local `gh webhook forward` on a tracked repo
  collides with production. The README says so.

## Non-goals

- Porting any ringo handler (reviews relay, spawn, CI-fixer, merge teardown).
- Org-level forwarding, which needs `admin:org_hook`.
- Ingesting repos ringo doesn't already track.

## Open questions

1. **Does `gh webhook forward` deliver byte-identical bodies?** That decides
   whether the audit key is `sha256(body)` or the semantic fallback. It's
   answered in shadow by comparing a forwarded body with the same event's
   delivery payload, and needs an answer before audit starts.
2. **How does `gh webhook forward` behave with a leftover dev hook?** It's
   answered in `run-gh-webhook-forward-as-an-ingest-process` before the
   supervisor's cleanup is written.

## Changelog

- 2026-10-21: drafted. Configuration and state moved into ActiveRecord. Ringo
  audit phase added. Review points addressed: template sections, story-mapped
  rollout, catch-up before hooks off, inactive-hook source rejected, relay
  ordering, script → trails task, cross-repo table.
