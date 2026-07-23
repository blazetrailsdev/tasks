---
title: "locking-column-setter-skips-schema-reload"
status: in-progress
updated: 2026-07-23
rfc: "0032-ar-gate-fidelity-burndown"
cluster: null
deps: []
deps-rfc: []
est-loc: null
priority: null
pr: 5144
claim: "2026-07-23T13:31:39Z"
assignee: "locking-column-setter-skips-schema-reload"
blocked-by: null
closed-reason: null
---

## Context

Found by per-entry wide-call verification. Rails `locking_column=`
(vendor/rails/activerecord/lib/active_record/locking/optimistic.rb:165-168)
calls `reload_schema_from_cache` before assigning so cached attribute types
pick up the new locking column. Trails `setLockingColumn`
(packages/activerecord/src/locking/optimistic.ts:28-30) assigns
`_lockingColumn` only; the reload helper exists at
packages/activerecord/src/attributes.ts:296. A model whose schema was already
reflected keeps stale locking metadata after the setter.

## Acceptance criteria

- setLockingColumn triggers the schema-from-cache reload as Rails does.
- A regression test that fails on the current baseline (stale metadata after
  reassignment) passes.
