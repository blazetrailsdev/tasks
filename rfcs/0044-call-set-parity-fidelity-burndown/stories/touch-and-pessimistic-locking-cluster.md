---
title: "Converge touch + pessimistic-locking call-set omissions"
status: ready
updated: 2026-06-29
rfc: "0044-call-set-parity-fidelity-burndown"
cluster: real-omission
deps: ["call-mismatches-ratcheting-baseline"]
deps-rfc: []
est-loc: 100
priority: 2
pr: null
claim: null
assignee: null
blocked-by: null
---

## Context

Four flagged pairs across touch + pessimistic locking:
`associations/builder/has-one.ts` `touch_record` (missing `touch`),
`touch-later.ts` `touch_deferred_attributes` (missing `touch`),
`locking/pessimistic.ts` `lock!` (missing `reload`) and `with_lock` (missing
`lock!`). Rails: has_one builder touches the owner; touch_later flushes
deferred touches; pessimistic.rb `lock!` reloads with a lock and `with_lock`
calls `lock!` inside a transaction. The locking chain (`with_lock`→`lock!`→
`reload`) is high-suspicion — skipping `reload` in `lock!` means the locked
read returns stale in-memory data.

## Acceptance criteria

- For each of the 4: compare Rails (has_one.rb builder, touch_later.rb,
  locking/pessimistic.rb) against the TS body.
- Real omissions converge (notably `lock!` must reload under lock) with tests
  (match Rails test names).
- Confirmed equivalents get justified baseline entries.
- All 4 entries resolved in `call-mismatches.json`.
