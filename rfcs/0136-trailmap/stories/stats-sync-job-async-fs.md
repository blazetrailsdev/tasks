---
title: "StatsSyncJob and logGhFailure move to async fs once FsAdapter has appendFile"
status: draft
updated: 2026-11-16
rfc: "0136-trailmap"
cluster: null
packages: []
deps: []
deps-rfc: []
est-loc: 60
priority: null
pr: null
claim: null
assignee: null
blocked-by: null
closed-reason: null
---

## Context

trailmap#146 used async fs (`writeFile(..., { flag: "a" })`) for the new `[sync-stats]` cap line in `lib/stats-sync/sync.ts` (`noteCap`). Everything else in `app/jobs/stats-sync-job.ts` is still sync: `appendFileSync` for the verdict lines, and `readLogTail` with `openSync`/`readSync`. So is `logGhFailure` in `lib/stats-sync/sync.ts`. These stayed sync because `FsAdapter` (`@blazetrails/ruby-compat` `fs-adapter.d.ts`) has no async `appendFile`. Trails story `fs-adapter-async-append-file` tracks that gap.

## Acceptance criteria

- Once `fs-adapter-async-append-file` lands and trails is re-vendored, StatsSyncJob and `logGhFailure` use only async fs: `appendFile` for appends, and `openAsync`/`readAsync` in `readLogTail`.
- `noteCap` switches from `writeFile` with `flag: "a"` to `appendFile`.
- `test/jobs/stats-sync-job.test.ts` passes unchanged.
