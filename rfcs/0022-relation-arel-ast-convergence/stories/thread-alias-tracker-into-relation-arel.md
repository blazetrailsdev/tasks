---
title: "thread-alias-tracker-into-relation-arel"
status: claimed
updated: 2026-07-05
rfc: "0022-relation-arel-ast-convergence"
cluster: null
deps: []
deps-rfc: []
est-loc: null
priority: 2
pr: null
claim: "2026-07-05T21:01:56Z"
assignee: "thread-alias-tracker-into-relation-arel"
blocked-by: null
---

## Context

`JoinAssociation#joinConstraints`
(`packages/activerecord/src/associations/join-dependency/join-association.ts`)
materializes a scope's join sources via `scope.arel().joinSources` (PR #3941,
story `scope-joinsources-via-relation-arel`), mirroring Rails'
`arel.join_sources`
(`vendor/rails/activerecord/lib/active_record/associations/join_dependency/join_association.rb:66`).

Rails actually calls `arel = scope.arel(alias_tracker.aliases)` — it threads the
`alias_tracker.aliases` into the manager so the materialized join sources are
alias-aware (collision-renamed table aliases reflected). trails'
`Relation#arel()` (`relation.ts:5835` → `toArel`) takes no arguments, so the
`aliasTracker` method param of `joinConstraints` is NOT threaded into `arel()`.
The emitted join sources therefore won't reflect alias-tracker renames.

This is part of the same broader divergence whereby `joinConstraints` reads
`scope._whereClause.ast` and filters predicates manually via `nodeReferencesTable`
rather than Rails' `arel.constraints.first` + `Arel.fetch_attribute` extraction
(`join_association.rb:55-63`). Both stem from `Relation#arel()` not accepting an
alias set.

## Acceptance criteria

- [ ] Extend `Relation#arel()` (and `toArel`) to accept an optional alias set,
      mirroring Rails `arel(aliases = nil)`.
- [ ] Thread `aliasTracker.aliases` from `joinConstraints` into the
      `scope.arel(...)` call so materialized join sources are alias-aware.
- [ ] Optionally converge the constraints extraction to read
      `arel.constraints.first` instead of `scope._whereClause.ast`.
- [ ] api:compare / test:compare delta stays non-negative.
