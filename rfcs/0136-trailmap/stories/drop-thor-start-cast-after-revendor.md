---
title: "trailmap: drop the Thor.start cast in lib/jobs.ts after re-vendoring past trails#9699"
status: in-progress
updated: 2026-11-04
rfc: "0136-trailmap"
cluster: null
packages: []
deps: []
deps-rfc: []
est-loc: 10
priority: null
pr: trailmap#113
claim: "2026-11-04T12:58:17Z"
assignee: "drop-thor-start-cast-after-revendor"
blocked-by: null
closed-reason: null
---

## Context

trails#9699 declared `static start` on `Thor` (packages/thor/src/thor.ts), so `SomeThorSubclass.start(argv)` typechecks. trailmap's `lib/jobs.ts` and `test/lib/jobs.test.ts` still cast to reach `start`. They can drop the cast only once vendor/TRAILS_PIN is at or past the #9699 merge, and per CLAUDE.md the re-vendor is its own PR.

## Acceptance criteria

- After a re-vendor past trails#9699, `lib/jobs.ts` and `test/lib/jobs.test.ts` call `Cli.start(argv)` without a cast.
- `pnpm build` and `pnpm test` pass.
