---
title: "Add a write canary for the claim path"
status: draft
updated: 2026-09-09
rfc: "0143-production-smoke"
cluster: null
packages: []
deps: ["record-smoke-runs-in-a-table"]
deps-rfc: []
est-loc: 300
priority: 2
pr: null
claim: null
assignee: null
blocked-by: null
---

## Context

RFC 0136 accepts the write path's lack of a fallback as its largest risk — "If
trailmap is down the CLI is down and the fleet stops" — and names the write
path as where the staleness bugs came from. Every check that exists today is a
read.

Tier 3 claims and releases a story every fifteen minutes and asserts both the
row and the event it should have written. Under phase B, ringo is a second
writer on the same SQLite file, so this is also the detector for WAL
contention.

RFC open question 3 is part of this story: a synthetic canary story is inert
but pollutes the backlog and every count over it, so the exclusion mechanism
has to be decided before the canary is written.

## Acceptance criteria

- [ ] Tier 3 claims then releases a reserved canary story and asserts the
      resulting row and event
- [ ] The canary story is excluded from the ready queue, the backlog page and
      every count, by a mechanism documented where it is defined
- [ ] A failed release leaves no claim behind that could wedge a later run
- [ ] Lock contention is reported as its own named assertion, distinct from a
      generic write failure
- [ ] The canary cannot be handed to a spawned agent

## Definition of done

Excluding the canary by filtering it out in each read site does not close this
story — one mechanism, one place.

## Verification

Fifteen minutes of runs leave the canary story in its starting state, and the
backlog counts are identical with the canary present and absent.
