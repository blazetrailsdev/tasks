---
title: "JoinDependency instantiation perf: un-skip eager_load too-many-ids on MySQL-family lanes"
status: in-progress
updated: 2026-06-23
rfc: "0030-ar-test-compare-residual-burndown"
cluster: null
deps: []
deps-rfc: []
est-loc: 150
priority: null
pr: 3989
claim: "2026-06-23T13:07:47Z"
assignee: "eager-load-too-many-ids-join-dependency-perf"
blocked-by: null
---

## Context

`EagerLoadingTooManyIdsTest > eager loading too many ids` (eager_test.rb:46-48,
`Citation.eager_load(:citations).offset(0).size`) is permanent-skipped in
`packages/activerecord/src/associations/eager.test.ts` as of PR #3930. Over the
65536-row citations fixture, `eager_load(:citations)` is a self-LEFT-JOIN whose
JoinDependency instantiation takes >360s on MariaDB (vs ~15s on SQLite), times
out even at a 120s test budget, and poisons the shared connection — cascading
into hook timeouts across the rest of the file. The sibling `preloading too many
ids` (IN-split preload, no join) runs in ~9s on MariaDB and stays unskipped.

The bind-limit/IN-split behavior the eager case nominally targets is already
covered by `preloading too many ids`; the blocker here is purely the
JoinDependency instantiation cost at scale on the MySQL-family lanes.

## Acceptance criteria

- [ ] Profile `JoinDependency#instantiateFromRows` / `construct` over the 65536-row
      no-fan-out self-join; identify the super-linear factor (likely per-row
      model_cache / association construction).
- [ ] Reduce it enough that `eager loading too many ids` runs within budget on
      MariaDB/MySQL, then un-skip the test (remove the `it.skip` + reason in
      eager.test.ts) Rails-faithfully.
- [ ] No new gate-mismatches.
