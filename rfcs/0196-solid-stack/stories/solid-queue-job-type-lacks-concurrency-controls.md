---
title: "SolidQueue Job type omits ConcurrencyControls members (handleConcurrencyConflict, block)"
status: draft
updated: 2026-11-19
rfc: "0196-solid-stack"
cluster: null
packages: []
deps: []
deps-rfc: []
est-loc: 20
priority: null
pr: null
claim: null
assignee: null
blocked-by: null
closed-reason: null
---

## Context

trailmap#171, `test/jobs/stats-sync-job.test.ts`: testing that `limitsConcurrency({ onConflict: "discard" })` drops an overlapping run means calling `SolidQueue::Job#handleConcurrencyConflict`. That method exists at runtime (`solid-queue/dist/job/concurrency-controls.js:37-44`) but not on the exported `Job` type (`dist/job.d.ts` carries only `jobClass` from the mixin, at :69). `job.handleConcurrencyConflict()` fails with TS2339, and the test had to declare a structural type for `Object.create(Job.prototype)`. `block`, `concurrencyOnConflict()` and the other ConcurrencyControls members have the same gap.

## Acceptance criteria

- `Job`'s declaration merges the full ConcurrencyControls interface (the way Rails' `include ConcurrencyControls` exposes it), so `handleConcurrencyConflict`, `block` and `concurrencyOnConflict` typecheck on a `Job`.
- A type-level test in solid-queue calls them on a `Job`.
