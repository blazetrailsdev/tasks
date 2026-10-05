---
title: "trailmap: an end-to-end harness for the dashboard's controls"
status: draft
updated: 2026-10-05
rfc: "0136-trailmap"
cluster: null
packages: []
deps: []
deps-rfc: []
est-loc: 150
priority: null
pr: null
claim: null
assignee: null
blocked-by: null
closed-reason: null
---

## Context

trailmap#37's click handler (`app/assets/javascripts/dashboard.js`) was verified by a one-off
script outside the repo: the real page in headless Chromium against a stand-in for ringo that
serves a fixture event stream and records the POSTs it receives. It found nothing the unit tests
missed, but it is the only thing that exercises the wiring (the listener, the event stream, the
`data-` attributes reaching `fetch`), and each remaining dashboard slice will want the same check.
It needed `playwright-core`, which trailmap does not depend on.

## Acceptance criteria

- [ ] A script in the repo runs the dashboard against a fixture ringo and asserts the requests each control sends and the button states after.
- [ ] It runs in CI, or the PR says why it cannot.
