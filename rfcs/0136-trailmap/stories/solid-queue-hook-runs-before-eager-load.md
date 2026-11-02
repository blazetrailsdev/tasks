---
title: "bin/jobs crashes: lib/jobs.ts imports app/jobs before the boot finishes"
status: done
updated: 2026-11-02
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

trailmap's `bin/jobs` crashed at boot with `this.limitsConcurrency is not a function`. The cause was `lib/jobs.ts`'s import order under top-level await: a static import of `app/jobs` evaluates while `config/environment.ts` is suspended on `Trails.initialize()`, before the Solid Queue engine's initializer runs. Eager load was not the cause, as it also crashes with `eagerLoad = false`. Found on trailmap#106.

trailmap#107 fixed it by importing `app/jobs` dynamically after the boot. No trails fix or re-vendor was needed. A trails worker then finished a row the Rails app enqueued (trailmap#106), proving the Rails-to-trails direction of CLAUDE.md's shared solid_queue artefact.
