---
title: "JoinDependency builds its own alias tracker and scans a side list for row-hash parent keys"
status: in-progress
updated: 2026-10-09
rfc: "0178-activerecord-arms-parity-100"
cluster: null
packages: []
deps: []
deps-rfc: []
est-loc: 250
priority: null
pr: trails#8724
claim: "2026-10-09T19:39:37Z"
assignee: "attribute-methods-initialize-generated-modules-deferral-guards"
blocked-by: null
closed-reason: null
---

## Context

Two arms in `packages/activerecord/src/associations/join-dependency.ts` that Rails' `JoinDependency` does not take, both receipted `@inventedArm if — CONVERGEABLE` against this story.

- `joinConstraints(joinsToAdd, aliasTracker?, references?)` builds its own `AliasTracker` when the caller passes none, and guards `references` for `undefined`. Rails' `join_constraints(joins_to_add, alias_tracker, references)` (`vendor/rails/v8.0.2/activerecord/lib/active_record/associations/join_dependency.rb:85-103`) assigns `@alias_tracker = alias_tracker` and takes all three as required. The constructor also seeds `_aliasTracker` (Rails' `initialize`, `:72-79`, does not). 25 call sites in six `join-dependency-*.trails.test.ts` / `cpk-eager-pluck-*.trails.test.ts` files call `joinConstraints([])` with one argument; the one production caller (`relation/query-methods.ts`, `build_joins`) passes all three.
- `instantiate` keys `parents` by `row_hash` when the root has no primary key (`:144`, `parent_key = primary_key ? row_hash[primary_key] : row_hash`). A Ruby Hash keys by `eql?`; the JS `Map` keys by identity, so the port scans a side list `rowHashKeys` with `rbEqual` and adds two branches. `parents[parent_key] ||= …` (`:145`) is likewise an `if (!parent)`.

## Acceptance criteria

- [ ] `joinConstraints` takes `aliasTracker` and `references` as required parameters and assigns the tracker unconditionally; the constructor no longer builds one; `_baseTableAliasLength` / `_baseAliases` go if nothing else reads them. Test call sites pass a tracker.
- [ ] `instantiate` keys `parents` through a value-keyed hash (ruby-compat `Hash`, which dispatches `rbHash` / `rbEqual`) so `parent_key` is Rails' one ternary, with no `rowHashKeys` scan.
- [ ] Both receipts are deleted and the invented-direction arms report shows no row for the two methods.
