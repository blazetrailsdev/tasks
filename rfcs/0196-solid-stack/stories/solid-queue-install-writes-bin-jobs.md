---
title: "solid_queue:install writes a bin/jobs that loads jobs after the boot"
status: done
updated: 2026-11-01
rfc: "0196-solid-stack"
cluster: null
packages: []
deps: []
deps-rfc: []
est-loc: 80
priority: null
pr: trails#9582
claim: "2026-11-01T18:41:29Z"
assignee: "limits-concurrency-typed-on-activejob-base"
blocked-by: null
closed-reason: null
---

Trails does not generate a `bin/jobs`, so each app hand-writes one. trailmap's crashed with `this.limitsConcurrency is not a function` (fixed in trailmap#107).

The cause is a trails/ESM trap. `config/environment.ts` awaits `Trails.initialize()` at its top level, and a sibling static import does not wait for that, so job classes evaluate before the Solid Queue engine's `solid_queue.active_job.extensions` initializer runs. Rails' `require` runs in sequence, so `solid_queue/v1.1.3/lib/generators/solid_queue/install/templates/bin/jobs` has no such trap.

Expected: `solid_queue:install` writes a `bin/jobs` that boots the application, then dynamically imports the job classes and the CLI, and forwards the command-line arguments. A test boots the generated file against a real queue database, so a regression in load order fails in trails. Also document the import-order trap for hand-written entry points.
