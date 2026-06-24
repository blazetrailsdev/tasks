---
title: "Seed build_joins AliasTracker with leading_joins + join_nodes (Rails alias_tracker)"
status: in-progress
updated: 2026-06-24
rfc: "0022-relation-arel-ast-convergence"
cluster: null
deps: []
deps-rfc: []
est-loc: 90
priority: null
pr: 4081
claim: "2026-06-24T19:26:48Z"
assignee: "build-joins-seed-alias-tracker-leading-join-nodes"
blocked-by: null
---

## Context

trails' unified `build_joins` emitter `emitJoinPlan`
(`packages/activerecord/src/relation/query-methods.ts`, after PR #4072) builds
its shared `AliasTracker` via `buildMergedJoinAliasTracker(this)` (or the
`aliases` threaded in from `build_from`), but does NOT seed it with the
leading-join + join-node tables the way Rails does.

Rails `build_joins`
(`vendor/rails/activerecord/lib/active_record/relation/query_methods.rb:1891`):

```ruby
alias_tracker = alias_tracker(leading_joins + join_nodes, aliases)
```

i.e. the tracker is seeded with `leading_joins + join_nodes` so that a
JoinDependency joining a table already claimed by a leading/raw join node is
re-aliased to its `alias_candidate`. trails' `buildMergedJoinAliasTracker`
seeds from the same-relation join buckets but not explicitly from
`leading_joins + join_nodes`. This is a pre-existing divergence carried through
the unification, not introduced by PR #4072.

## Acceptance criteria

- [ ] The shared tracker in `emitJoinPlan` is seeded with the leading-join + join-node tables, matching Rails' `alias_tracker(leading_joins + join_nodes, aliases)`.
- [ ] Add coverage for an association join onto a table already named by a raw/leading join node (it must alias to the `alias_candidate`).
- [ ] api:compare and test:compare deltas non-negative.
