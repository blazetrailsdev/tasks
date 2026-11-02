---
title: "limitsConcurrency is typed on ActiveJob's Base"
status: done
updated: 2026-11-01
rfc: "0196-solid-stack"
cluster: null
packages: []
deps: []
deps-rfc: []
est-loc: 30
priority: null
pr: trails#9582
claim: "2026-11-01T18:41:29Z"
assignee: "limits-concurrency-typed-on-activejob-base"
blocked-by: null
closed-reason: null
---

solid_queue adds limits_concurrency to ActiveJob::Base (solid_queue v1.1.3 lib/active_job/concurrency_controls.rb:16). trails adds it at runtime but activejob Base does not type it, so trailmap carries `declare static limitsConcurrency` in app/jobs/stats-sync-job.ts. Converged shape: importing @blazetrails/solid-queue augments Base with the static; delete the declare in trailmap.
