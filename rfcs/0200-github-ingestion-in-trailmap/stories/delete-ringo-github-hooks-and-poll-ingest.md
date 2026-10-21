---
title: "Hooks off: delete ringo's GitHub hooks, the redelivery poller and poll-ingest"
status: ready
updated: 2026-10-21
rfc: "0200-github-ingestion-in-trailmap"
cluster: null
packages: [trailties]
deps: [cut-ringo-over-to-the-trailmap-relay, catch-up-missed-deliveries-on-reconnect]
deps-rfc: []
est-loc: 180
priority: null
pr: null
claim: null
assignee: null
blocked-by: null
closed-reason: null
---

**Lands in:** trailmap (a task), btwebooks (code), GitHub (hooks) and dokku
(routing). The cross-repo scope is deliberate: this is where ringo's
ingestion ends.

## Context

**Gate:** Verification 2, 7 consecutive days with zero `RelayAudit` misses.

- **trailmap:** task `ingest:delete-ringo-hooks` deletes each
  `RepositorySetting.ringo_hook_id` with `Setting` `github_token` (`repo`
  scope can delete repo hooks), clears the column, and records an `Event`.
- **btwebooks:** remove the audit mode (it now always acts on
  `/webhooks/relay`), `/webhooks/github`, `StartRedeliveryPoller`,
  `StartDeliveryPollIngest`, and the `WEBHOOK_URL_SUBSTRING`/`POLL_INGEST_*`
  config.
- **dokku:** remove btwhooks' public route and SSO bypass for
  `/webhooks/github`.

## Acceptance criteria

- [ ] The gate's 7-day zero-miss window is linked on the PR
- [ ] No hook on the ingesting repos points at btwhooks
- [ ] ringo builds and its tests pass without the pollers
- [ ] `https://btwhooks.deanoftech.com/webhooks/github` doesn't answer from outside, and relayed events still arrive
