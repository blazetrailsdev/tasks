---
title: "Run the smoke suite on a schedule on the box"
status: draft
updated: 2026-09-09
rfc: "0143-production-smoke"
cluster: null
packages: []
deps: ["extract-the-deploy-assertions-into-a-smoke-suite"]
deps-rfc: []
est-loc: 200
priority: 2
pr: null
claim: null
assignee: null
blocked-by: null
---

## Context

The suite is worth little until it runs without anyone asking. It cannot run
from GitHub Actions for the same reason the validation split exists: the API
binds to loopback and Actions cannot reach it.

Ringo's cron surface is the cheap home today. Trailmap's own scheduler is the
destination, and building one is proving-ground work — background jobs are
framework surface nothing has made trails exercise. This story takes the cheap
home and files the story that moves it.

## Acceptance criteria

- [ ] Tiers 0–2 run at the cadences the RFC states (30s, 1m, 5m)
- [ ] A failing run is visible somewhere a human already looks, not only in a
      log file
- [ ] A slow or hung tier cannot pile up overlapping runs
- [ ] The suite runs against the live app, never a locally booted copy
- [ ] The story that moves scheduling into trailmap is filed and linked here

## Verification

`/crons` shows the three entries with recent successful runs; stopping the app
turns tier 0 red within one cadence.
