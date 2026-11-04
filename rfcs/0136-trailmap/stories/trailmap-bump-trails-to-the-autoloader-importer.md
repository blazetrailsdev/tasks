---
title: "trailmap: bump trails to the autoloader importer, and drop the hand-written model and job seating"
status: claimed
updated: 2026-11-04
rfc: "0136-trailmap"
cluster: null
packages: ["trailties", "activestorage"]
deps: ["trailmap-app-files-define-their-constants"]
deps-rfc: []
est-loc: 250
priority: null
pr: null
claim: "2026-11-04T12:58:17Z"
assignee: "drop-thor-start-cast-after-revendor"
blocked-by: null
closed-reason: null
---

## Context

trailmap's vendored trails (945a06ff5b) predates RFC 0213's autoloader
seating in the test's module graph (`Loader#importer`, trails#9683) and the
deletion of `registerModel` (#9656) and `registerConstant` (#9681). Until it is
bumped, trailmap seats its models and jobs by hand: `registerModel(ALL_MODELS)`
in lib/model-schemas.ts and the registry in lib/job-classes.ts (trailmap#112).
The bump also brings `@blazetrails/activestorage`, which
trailmap-audits-to-activestorage needs.

## Acceptance

- `scripts/vendor-trails.sh` vendors `@blazetrails/activestorage` with the rest,
  at a trails ref that has trails#9683.
- `config/environment.ts` sets `loader.importer = (url) => import(url)` on
  every loader, as `trails new` generates it.
- `registerModel(ALL_MODELS)` and lib/job-classes.ts are deleted; lib/jobs.ts
  imports no job class; tests import jobs from app/jobs.
- `pnpm test` is green. A scratch bump to trails 6ae206bf75 fails on:
  test/routes.test.ts (`registerController` is gone from actionpack),
  `/up` routing to `Rails::HealthController` (probes-controller.test.ts),
  and stats-sync upserts raising "No unique index found for id"
  (stats-sync-records.test.ts, lib/stats-sync.test.ts). Each is either a
  trailmap fix or a filed trails story.
- Kept to the vendor change plus what the new trails requires, per
  CLAUDE.md "Bumping is its own PR".
