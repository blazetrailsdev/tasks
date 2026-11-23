---
title: "Isolation.included parallelizes the including class (parallelize_me!)"
status: blocked
updated: 2026-11-23
rfc: "0246-activesupport-parity-100"
cluster: null
packages: []
deps:
  - isolation-tests-hooks-move-to-setup-teardown
deps-rfc: []
est-loc: 120
priority: null
pr: null
claim: "2026-11-23T20:52:28Z"
assignee: "isolation-included-parallelize-me"
blocked-by: "waits on isolation-tests-hooks-move-to-setup-teardown: ~30 registered Isolation files share t across parent beforeEach/afterEach and would race when concurrent"
closed-reason: null
---

## Context

Rails' `ActiveSupport::Testing::Isolation.included` calls `parallelize_me!` on every including class (`vendor/rails/v8.0.5.2/activesupport/lib/active_support/testing/isolation.rb:10-14`), so isolated tests run concurrently. Each one is already its own subprocess.

The trails port drops the call: `packages/activesupport/lib/testing/isolation.ts:32` carries `@missingRailsCall parallelize_me! — PERMANENT`. Every isolated test spawns a full `vitest run` child that costs ~27s to transform and collect (`isolation.ts:108`), so a file with N isolated tests takes about N × 27s run serially.

trails#10650 converged one file by hand: `configuration.test.ts` moved its hooks onto `IsolatedConfigurationTest#setup` / `#teardown` and marked the describe `{ concurrent: true }`. The configuration shard went from 27 min to 9 min.

## Converged shape

Including `Isolation` is enough to make a class's tests run concurrently, with no per-file `concurrent` flag. vitest decides concurrency at collection time, so the hook has to reach the describe some other way: `registerSpecType` / autorun marks the suite's tasks concurrent, or the hook sets something the describe reads. Then delete the `@missingRailsCall parallelize_me!` receipt. The receipt is not language-forced, so it is not PERMANENT.

## Acceptance criteria

- A class that includes `Isolation` runs its tests concurrently without a per-file flag.
- The `parallelize_me!` receipt in `isolation.ts` is removed.
- `configuration.test.ts` drops its explicit `concurrent: true`.
- Depends on the sibling story that moves the parent-side hooks into `setup`/`teardown`, since concurrent parent hooks race on the shared `t`.
