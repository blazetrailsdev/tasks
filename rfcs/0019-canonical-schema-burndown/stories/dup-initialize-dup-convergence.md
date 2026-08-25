---
title: "dup-initialize-dup-convergence"
status: done
updated: 2026-06-20
rfc: "0019-canonical-schema-burndown"
cluster: null
deps: []
deps-rfc: []
est-loc: null
priority: null
pr: 3701
claim: "2026-06-20T03:18:42Z"
assignee: "dup-initialize-dup-convergence"
blocked-by: null
---

## Context

`Persistence#dup` (packages/activerecord/src/persistence.ts:1235) rebuilds a
duplicate via `new ctor(attrs)` after stripping the primary key. It does NOT
run Rails' `initialize_dup` chain, so several Rails `dup` behaviors diverge.
Surfaced while converting `dup.test.ts` onto the canonical schema
(persistence-dup-cluster); these Rails tests are currently `it.skip` with
`BLOCKED (dup-initialize-dup-convergence)` tags:

- `test_is_readonly` — Ruby's ivar-copying `Object#dup` carries `@readonly`
  onto the duplicate; trails' reconstruct-from-attrs path loses it.
- `test_dup_timestamps_are_cleared` — `Timestamp#initialize_dup`
  (`clear_timestamp_attributes`) is never invoked, so created_at/updated_at
  survive onto the dup. The hook already exists at timestamp.ts `initializeDup`
  but is not wired into `dup`.
- `test_dup_locking_column_is_cleared` — `Locking::Optimistic#initialize_dup`
  (`_clear_locking_column`) is never invoked, so lock_version is not reset to
  its column default (0).
- `test_dup_with_changes` — the duplicate's dirty `changes` snapshot diverges
  from Rails because the `initialize_dup` chain (which resets the mutation
  tracker) does not run.

There is partial infra: `initializeDup` hooks exist in timestamp.ts and
aggregations.ts (and an `initializeDup(other)` declaration on the Base host
interface) but nothing composes/invokes them from `dup`.

## Acceptance criteria

- [ ] `dup` runs the composed `initialize_dup` chain (timestamp + locking +
      aggregations + readonly-copy) so the four skipped `dup_test.rb` tests pass
      with Rails-faithful behavior.
- [ ] Un-skip the four tests in `packages/activerecord/src/dup.test.ts` and drop
      their `BLOCKED` tags.
- [ ] No regressions in existing `dup`/clone callers.
