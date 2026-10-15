---
title: "trailmap: manual spawn joins the dashboard's one control listener and its e2e harness"
status: ready
updated: 2026-10-15
rfc: "0136-trailmap"
cluster: null
packages: []
deps: []
deps-rfc: []
est-loc: 90
priority: null
pr: null
claim: null
assignee: null
blocked-by: null
closed-reason: null
---

## Context

trailmap#37 gave every row control one click listener, `controlRequest` and
`controlOutcome`; #64 and #65 added the `+` buttons, broadcast, drain, poke
and the question answers to it. The manual spawn button is the one control
still outside: `app/assets/javascripts/dashboard.js` binds its own listener
to `#spawn`, builds its own `fetch`, and decides its own status text inline —
none of it reachable from a unit test.

It is also the one control `scripts/dashboard-e2e.ts` does not click (the PR
said so). `FLEET_CONTROLS` lists `spawn`, so the relay half is tested; the
page half is not.

## Acceptance criteria

- [ ] Manual spawn is a `data-action` control whose request and outcome are
      decided in `fleet-format.js` and unit-tested.
- [ ] `scripts/dashboard-e2e.ts` clicks it and asserts the POST
      (`{ repoDir, message }`) and the status text after.
