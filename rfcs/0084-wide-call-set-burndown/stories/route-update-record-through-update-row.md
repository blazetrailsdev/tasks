---
title: "route-update-record-through-update-row"
status: done
updated: 2026-08-13
rfc: "0084-wide-call-set-burndown"
cluster: null
packages: []
deps: []
deps-rfc: []
est-loc: null
priority: null
pr: 6473
claim: "2026-08-13T16:05:43Z"
assignee: "route-update-record-through-update-row"
blocked-by: null
closed-reason: null
---

## Context

`persistence.ts#_updateRecord` (the instance-side `instanceUpdateRecord`, the
bottom of the save chain) builds and executes its own `UpdateManager` inline —
its own lock-column SET/WHERE handling and its own `StaleObjectError`
throw/restore. Rails decomposes this: `Persistence#_update_record`
(`persistence.rb:900-916`) calls `_update_row(attribute_names)`
(`persistence.rb:944-946`), which `Locking::Optimistic#_update_row`
(`locking/optimistic.rb:92-118`) overrides to add the lock bump, the
`_lock_value_for_database` constraint and the `affected_rows != 1` raise before
delegating to the class-level `_update_record(values, constraints)`.

trails already has BOTH halves of that split, correctly shaped, and neither is
reachable from the save path:

- `persistence.ts:1945` `_updateRow(attributeNames, _attemptedAction)` — calls
  the class-level `_updateRecord` with `_queryConstraintsHash`. Wired onto the
  prototype at `base.ts:4544`. Only the `touch` path reaches it
  (`persistence.ts:1941` `_touchRow`, `attribute-methods/dirty.ts:182`).
- `locking/optimistic.ts:216` `_updateRow(attributeNames, attemptedAction,
superFn)` — a faithful mirror of `Locking::Optimistic#_update_row`, in the
  CLAUDE.md `superFn` mixin shape. It has **zero call sites**:
  `LockingOptimistic.InstanceMethods` (`locking/optimistic.ts:310`) exports only
  `_lockValueForDatabase`, `_clearLockingColumn` and `_queryConstraintsHash`, so
  the override is never installed over `_Persistence._updateRow`.

Two consequences, both pre-existing (they predate PR #6430, which only moved the
inline body from `base.ts#_performUpdate` into `persistence.ts` unchanged):

1. Two independent hand-maintained implementations of the same optimistic-locking
   dance that can silently drift.
2. Because the locking `_updateRow` override is not installed, the `touch` path
   goes through the plain `_Persistence._updateRow` — so a `touch` on a
   locking-enabled model does not enforce the lock-version WHERE or raise
   `StaleObjectError`, where Rails' `_update_row` override does. Check this
   against `vendor/rails/activerecord/test/cases/locking_test.rb` before
   assuming it is only a shape issue.

The convergence is not a pure move, which is why PR #6430 did not attempt it:
the save path binds `_attributes.valuesForDatabase()` (write-path
DB-serialized primitives — see the `writePathValueNode` note in
`persistence.ts`), while `_updateRow` builds its values from `readAttribute`
and `attributes_with_values` (cast values). Routing the save path through
`_updateRow` changes what reaches the adapter for every column type (binary,
temporal, array, serialized, decimal), so it needs its own test pass. That
difference is exactly the standing `_update_row` / `attributes_with_values` row
in `scripts/api-compare/call-mismatches-exclude/activerecord/persistence.json`.

## Overlap

`0023-surfaced-deviations/wire-locking-touch-update-row-into-persistence-path`
(ready, est 120) already owns installing `LockingOptimistic._touchRow` /
`._updateRow` into `InstanceMethods` and the touch path. Claim both together or
sequence this one after it — the install is a prerequisite for routing the save
path through `_updateRow`, and doing them in separate PRs leaves the save path
delegating to an unwrapped `_updateRow` with no lock enforcement in between.

## Acceptance criteria

- [ ] `instanceUpdateRecord` calls `_updateRow(attributeNames)` instead of
      building its own `UpdateManager`; the UPDATE build lives in `_updateRow`
      and the lock bump / constraint / `StaleObjectError` raise live in
      `LockingOptimistic._updateRow`, matching `optimistic.rb:92-118`.
- [ ] `LockingOptimistic._updateRow` is actually installed over
      `_Persistence._updateRow` in the `superFn` chain, so the `touch` path gets
      the lock enforcement Rails gives it.
- [ ] The value/bind path is settled explicitly: either `_updateRow` is
      converged onto the write-path values or the `attributes_with_values`
      baseline row keeps its reviewed reason. Write-path bind coverage
      (`write-path-binds.trails.test.ts`, binary, temporal, serialized,
      array/PG) stays green.
- [ ] Locking, custom-locking, touch-later, timestamp, persistence, dirty and
      autosave suites green on all three adapters.
- [ ] `pnpm parity:api:calls` / `:args` green; no new baseline rows.
