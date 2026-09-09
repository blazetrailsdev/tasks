---
title: "track-trails-from-main-in-trailmap"
status: draft
updated: 2026-09-09
rfc: "0136-trailmap"
cluster: null
packages: []
deps: []
deps-rfc: []
est-loc: 80
priority: null
pr: null
claim: null
assignee: null
blocked-by: null
closed-reason: null
---

## Context

The continuous-tracking machinery — `scripts/track-trails.sh`,
`scripts/smoke-cli.ts`, `scripts/trails-status.ts` and the `pnpm smoke` CI step
— lives in `blazetrailsdev/tasks`, where it protects the CLI. The
`blazetrailsdev/trailmap` repo vendors trails the same way and is _staler
still_: its `vendor/TRAILS_PIN` reads `7cece02d95798cb355ae5d73c0a651c95e09f61c`,
older than the tasks pin was.

trailmap has its own copy of `scripts/vendor-trails.sh`, its own `vendor/*.tgz`
(a larger set — it also vendors `actionpack` and `actionview`), and its own
`pnpm.overrides` block. So the mechanism ports, but not by copying a file: the
smoke check has to be trailmap's, not the CLI's.

Note that trailmap's bootstrap hazard is strictly weaker than the CLI's. A
broken trails wedges a web app's deploy, not the fleet's ability to dispatch
the agent who would fix it. The scratch-worktree gate is still worth having —
it is what keeps a red main out of the deployed checkout — but the argument for
it here is ordinary CD, not deadlock avoidance.

## Expected shape

- A trailmap `pnpm smoke` that means for trailmap what the CLI's means for
  tasks: boot the application, run a migration, render at least one real page
  through the `.tse` pipeline, and hit one JSON endpoint. Rendering is the
  point — trailmap's vendored surface includes actionview and actionpack, and
  the render path is exactly where the two open bump stories
  (`re-vendor-trails-for-app-helpers`,
  `bump-vendored-trails-for-testcase-request-bodies`) expect fallout.
- `track-trails.sh` adapted to trailmap's package set and repo layout, driven
  by the same scratch-worktree-then-promote sequence.
- Both bump stories above are then satisfied by the first successful tracked
  bump rather than by hand-running the vendor script — check whether they can
  be closed against it.

## Depends on

The trails packaging fix (five packages missing `files: ["dist"]`) blocks this
the same way it blocks the tasks side — trailmap vendors `date`, `globalid`,
`i18n` and `ruby-compat` too.

## Acceptance criteria

- trailmap has a smoke check that exercises boot, migrate, one rendered page
  and one JSON endpoint, and fails non-zero on a broken trails.
- trailmap tracks trails main on a schedule, with the same
  verify-in-scratch-then-promote-with-rollback shape.
- `vendor/TRAILS_PIN` in trailmap moves off `7cece02d` to a commit containing
  trails#7558, and `app/helpers` is reachable from a `.tse` template.
