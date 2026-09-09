---
title: "Split the health endpoint into liveness and readiness"
status: draft
updated: 2026-09-09
rfc: "0000-production-smoke"
cluster: null
packages: []
deps: []
deps-rfc: []
est-loc: 180
priority: 1
pr: null
claim: null
assignee: null
blocked-by: null
---

## Context

`app/controllers/health-controller.ts` states its contract: it "deliberately
touches no dependency: a third-party outage should not restart the
application." That is correct for a probe wired to dokku's healthcheck and the
restart policy, and it must not change.

It is also the only thing running between deploys, which means every
process-up failure — a pending migration, a locked database, an unwritable
checkout — is invisible. A probe that answers `{"status":"ok"}` without opening
the database cannot see any of them.

This story adds the two probes beside it. `/up/ready` answers "can this serve
correct answers right now"; a red `/up/ready` means stop routing here, not
restart. `/up/deep` computes a real ready queue and is called only by the
canary.

## Acceptance criteria

- [ ] `/up` is unchanged in behaviour and still touches no dependency
- [ ] `/up/ready` opens the database, confirms a non-zero story count, and
      confirms the tasks checkout is writable with a git identity configured
- [ ] `/up/ready` answers 200 with a per-check breakdown, or 503 with the
      failing check named — never a bare boolean
- [ ] `/up/deep` computes a ready queue and reports row count and latency
- [ ] Both new routes are loopback-only, like the rest of the API
- [ ] A test proves each check can go red independently

## Definition of done

Widening `/up` itself to touch the database does not close this story — that
is the failure the health controller's comment guards against.

## Verification

`curl -fsS localhost:8080/up/ready | jq` names every check; with the database
moved aside it answers 503 naming that check and `/up` still answers 200.
