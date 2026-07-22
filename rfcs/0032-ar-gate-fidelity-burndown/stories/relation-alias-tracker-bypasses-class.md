---
title: "relation-alias-tracker-bypasses-class"
status: ready
updated: 2026-07-22
rfc: "0032-ar-gate-fidelity-burndown"
cluster: null
deps: []
deps-rfc: []
est-loc: null
priority: null
pr: null
claim: null
assignee: null
blocked-by: null
closed-reason: null
---

## Context

Found by per-entry wide-call verification. Rails `Relation#alias_tracker`
(vendor/rails/activerecord/lib/active_record/relation.rb:1307-1309) builds
`Associations::AliasTracker.create(model.connection_pool, table.name, joins,
aliases)`. Trails `Relation#aliasTracker`
(packages/activerecord/src/relation.ts:6465-6471) builds a bare
`Record<string, number>` join-count map and never touches the AliasTracker
class, which exists at
packages/activerecord/src/associations/alias-tracker.ts:60 and is already used
by join-dependency.ts:187 (via `new AliasTracker`, itself diverging from
Rails' `.create`).

## Acceptance criteria

- `Relation#aliasTracker` returns an AliasTracker built the way Rails builds
  it (AliasTracker.create with the initial-count seed from joins).
- Callers of the current count-map shape converged or removed.
