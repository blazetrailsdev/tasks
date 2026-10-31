---
title: "The Rails twin runs Solid Queue"
status: draft
updated: 2026-10-31
rfc: "0136-trailmap"
cluster: null
packages: []
deps: []
deps-rfc: []
est-loc: 200
priority: null
pr: null
claim: null
assignee: null
blocked-by: null
closed-reason: null
---

trails runs Solid Queue in trailmap (StatsSyncJob) and rails/ does not. Add it to rails/ with a test on each side that runs a job the other enqueued, per CLAUDE.md shared artefacts.
