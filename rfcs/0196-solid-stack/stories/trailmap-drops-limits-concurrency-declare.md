---
title: "trailmap drops its limitsConcurrency declare and hand-written bin/jobs"
status: draft
updated: 2026-11-01
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

trails#9582 typed `limitsConcurrency` on ActiveJob `Base` when `@blazetrails/solid-queue` is imported (solid_queue v1.1.3 lib/active_job/concurrency_controls.rb:16). trailmap still has the temporary `declare static limitsConcurrency` at app/jobs/stats-sync-job.ts:29-30, and its hand-written lib/jobs.ts calls `new Cli().start()`, so it forwards no arguments.

## Acceptance criteria

- trailmap takes a solid-queue tarball containing trails#9582.
- The `declare` and its comment are deleted, and trailmap typechecks.
- bin/jobs is replaced by the `solid_queue:install` output, which forwards arguments.
