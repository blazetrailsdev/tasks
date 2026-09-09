---
title: "Soak trailmap as the fleet dashboard before any cutover"
status: blocked
updated: 2026-09-09
rfc: "0136-trailmap"
cluster: null
packages: []
deps: []
deps-rfc: []
est-loc: 60
priority: null
pr: null
claim: null
assignee: null
blocked-by: "Phase F gate: trailmap becomes the public dashboard. Held until phase B/C parity work above lands and its gates are green in CI. Sign-off is explicit and by the RFC owner."
closed-reason: null
---

## Context

RFC 0136's revised rollout gates every irreversible step — the CLI move, the
database move, authoring and ingest, export, stripping the tasks repo, deleting
the published JSON — behind this story. Those six are `blocked` today with a
reason pointing here.

The reason for the gate: the cutover phase has no offline fallback by design.
If trailmap is down the CLI is down and the fleet stops. That is acceptable
only if trailmap has already been the thing everyone opens, for long enough
that its failure modes are known ones.

## Acceptance criteria

- trailmap serves the public dashboard hostname, and is the page a person
  actually opens, for **two weeks** of normal fleet operation.
- ringo keeps serving the loopback API, the webhook ingest and the SSE streams
  throughout. Nothing is deleted during the soak.
- Every phase B and phase C gate is green in CI for the whole period.
- Incidents are recorded: what broke, whether it was trailmap or the framework,
  and the story that fixes it. A soak with an unfixed incident does not pass.
- On sign-off, unblock the six cutover stories in the order RFC 0136's Rollout
  states. Sign-off is explicit and by the RFC owner — not automatic on the
  calendar.
