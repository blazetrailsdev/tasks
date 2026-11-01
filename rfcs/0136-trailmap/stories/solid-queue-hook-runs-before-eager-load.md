---
title: "bin/jobs crashes: eager load runs before Solid Queue's active_job hook"
status: in-progress
updated: 2026-11-01
rfc: "0136-trailmap"
cluster: null
packages: []
deps: []
deps-rfc: []
est-loc: 30
priority: null
pr: trailmap#107
claim: "2026-11-01T17:55:50Z"
assignee: "solid-queue-hook-runs-before-eager-load"
blocked-by: null
closed-reason: null
---

trailmap's `bin/jobs` crashes at boot under production config with `this.limitsConcurrency is not a function`. `config.eagerLoad` evaluates `app/jobs/stats-sync-job.ts` before the Solid Queue engine's `onLoad("active_job")` hook includes ConcurrencyControls (solid-queue engine.js:40), so a job's static block cannot call it. Rails' lazy load hook runs when ActiveJob::Base loads, before any subclass body. Found on trailmap#106; it stops the stats trial.

Expected: fix in trails with a test there, re-vendor, then a trails worker finishes a row the Rails app enqueued, proving the Rails-to-trails direction of CLAUDE.md's shared solid_queue artefact.
