---
title: "Correct the bin/jobs crash record once the Rails twin lands"
status: done
updated: 2026-11-02
rfc: "0136-trailmap"
cluster: null
packages: []
deps: []
deps-rfc: []
est-loc: 15
priority: null
pr: trailmap#111
claim: "2026-11-02T17:36:26Z"
assignee: "bin-jobs-forwards-its-arguments"
blocked-by: null
closed-reason: null
---

trailmap#107 showed `solid-queue-hook-runs-before-eager-load` misdiagnosed the crash: it was `lib/jobs.ts` import order under top-level await, not eager load (it also crashes with `eagerLoad = false`). No trails fix or re-vendor was needed.

Expected: once #106 lands, correct that story's title and body, correct #106's PR text and the "Solid Queue is trails-only" entry in `rails/DEVIATIONS.md`, and confirm #106's tests on each side carry the Rails-to-trails proof. Then mark `solid-queue-hook-runs-before-eager-load` done with `--pr trailmap#107`.
