---
title: "Refresh trailties shard durations and split configuration-multi-dbs after isolation-dist"
status: draft
updated: 2026-11-25
rfc: "0142-trailties-surfaced-deviations"
cluster: null
packages: ["trailties"]
deps: []
deps-rfc: []
est-loc: 30
priority: null
pr: null
claim: null
assignee: null
blocked-by: null
closed-reason: null
---

## Context

trails#10729 made `Isolation::Subprocess` children (`packages/activesupport/lib/testing/isolation.ts`, `runInIsolation`) load the framework from `dist` under `ISOLATION_DIST=1` (`scripts/ci/isolation-dist-resolver.ts`, `vitest.config.ts` trailties project), cutting each isolated trailties test ~3-4x. The Trailties Tests lane went 21m04s (main run 45517934323) -> 9m48s with 9 jobs (run 45532506959).

Two loose ends:

1. The `trailties` table in `scripts/ci/ar-shard-durations.json` still carries pre-speedup per-file weights (e.g. `packages/trailties/test/trailties/engine.test.ts` at 244263, recorded before the change). `DurationSequencer` (`scripts/ci/duration-sequencer.ts`) balances the six numbered shards on it; on run 45532506959 they ranged 3m40s-5m52s.
2. The `configuration-multi-dbs` matrix leg (`.github/workflows/ci.yml`, `trailties-tests` job) runs `configuration.test.ts` and `rake/multi-dbs.test.ts` back to back and took 9m48s, setting the lane; `test-runner` is 9m00s. On separate legs they took 4m59s and 4m43s (run 45530931398).

## Acceptance criteria

- Refresh only the `trailties` key of `ar-shard-durations.json` from a green main run after trails#10729: `node scripts/ci/ar-shard-durations.mjs <run-id>`, keeping the AR tables untouched (as #10693 did).
- Split `configuration-multi-dbs` into two `files:` legs, or show from the refreshed run that the numbered shards can absorb one of the two without starving neighbours (the `concurrent: true` starvation seen in #10693, run 45321187649).
- The PR records the lane wall-clock before and after; the lane is set by `test-runner` (~9m) or less.
