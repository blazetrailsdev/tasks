---
title: "Port lock_optimistically class config + gate lockingEnabled on it"
status: done
updated: 2026-06-24
rfc: "0023-surfaced-deviations"
cluster: null
deps: []
deps-rfc: []
est-loc: 60
priority: null
pr: 4048
claim: null
assignee: null
blocked-by: null
---

## Context

`lock_optimistically` is a Rails `class_attribute` (default true) that lets a
model disable optimistic locking even when a `lock_version` column exists:
`vendor/rails/activerecord/lib/active_record/locking/optimistic.rb:45-56`.
`locking_enabled?` gates on BOTH the flag and the column —
`lock_optimistically && columns_hash.include?(locking_column)`
(`optimistic.rb:157-162`).

trails diverges: `lockingEnabled` checks only column presence
(`packages/activerecord/src/locking/optimistic.ts:37-38`), with no
per-model toggle. PR #4048 (api-compare config accessors) skipped
`lock_optimistically`/`=`/`?` with a justification in
`scripts/api-compare/conventions.ts` (tracked-pending-convergence) because
porting the reader requires real config + threading through `lockingEnabled`.

## Acceptance criteria

- Add a `lock_optimistically` class config accessor (reader + `=` writer,
  default true) on the model, realized as trails state (not hardcoded).
- `lockingEnabled` gates on `lockOptimistically && <lock_version column present>`,
  matching Rails `optimistic.rb:157-162`.
- Setting `Model.lockOptimistically = false` disables optimistic locking even
  when `lock_version` exists (add a test mirroring Rails behavior).
- Remove `lock_optimistically`/`=`/`?` from the SKIP_GROUPS entry in
  `scripts/api-compare/conventions.ts`; locking/optimistic.ts stays at 100%.
