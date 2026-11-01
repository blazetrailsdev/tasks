---
title: "The Rails twin runs Solid Queue"
status: in-progress
updated: 2026-11-01
rfc: "0136-trailmap"
cluster: null
packages: []
deps: []
deps-rfc: []
est-loc: 200
priority: null
pr: trailmap#106
claim: "2026-11-01T14:56:30Z"
assignee: "attribute-rejects-a-name-that-shadows-base"
blocked-by: null
closed-reason: null
---

trails runs Solid Queue in trailmap (StatsSyncJob) and rails/ does not. Add it to rails/ with a test on each side that runs a job the other enqueued, per CLAUDE.md shared artefacts.
