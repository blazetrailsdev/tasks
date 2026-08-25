---
title: "connection-swapping-nested: declare Rails' full shard database sets"
status: done
updated: 2026-07-27
rfc: "0071-ar-test-helper-suite-wide-config-fidelity"
cluster: null
deps: []
deps-rfc: []
est-loc: 60
priority: null
pr: 5444
claim: "2026-07-27T19:35:52Z"
assignee: "connection-swapping-nested-full-shard-configs"
blocked-by: null
closed-reason: null
---

## Context

`packages/activerecord/src/connection-adapters/connection-swapping-nested.test.ts`
carries a pre-existing shard-config simplification vs Rails
(`vendor/rails/activerecord/test/cases/connection_adapters/connection_swapping_nested_test.rb`).
Surfaced during review of #5283 (which made the DBs file-backed and did not
touch the shard bodies).

Missing relative to Rails:

- `test_shards_can_be_swapped_granularly` (rb:118-134) and
  `test_roles_and_shards_can_be_swapped_granularly` (rb:206-222) declare
  `primary_shard_two` / `primary_shard_two_replica`; trails declares only
  `primary_shard_one`.
- `test_connected_to_many` (rb:292-314) declares the full shard set for
  primary, secondary AND tertiary (`tertiary_shard_one`, `tertiary_shard_two`
  and their replicas); trails' "connected to many" declares only the six
  non-sharded databases.

## Acceptance criteria

- [ ] The three shard-bearing tests declare the same database sets as their
      Rails counterparts, including `primary_shard_two*` and `tertiary_shard_*`.
- [ ] New databases follow the file-backed topology already established in the
      file (each replica shares its primary's file; `sqliteDb(name)` helper).
- [ ] Test names unchanged; assertion bodies mirror the Rails tests.
- [ ] CI green on all three adapters; `parity:test` delta non-negative.
