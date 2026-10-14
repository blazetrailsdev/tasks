---
title: "activerecord: Relation#_fromLimitedIds is a member Rails does not have"
status: ready
updated: 2026-10-14
rfc: "0189-activerecord-surfaced-deviations"
cluster: null
packages: []
deps: []
deps-rfc: []
est-loc: 200
priority: null
pr: null
claim: null
assignee: null
blocked-by: null
closed-reason: null
---

## Context

`Relation#_fromLimitedIds` (`packages/activerecord/src/relation.ts`, read by `buildFrom` in `packages/activerecord/src/relation/query-methods.ts`) is a member with no Rails counterpart. Rails' `build_from` (`vendor/rails/v8.0.2/activerecord/lib/active_record/relation/query_methods.rb`, `opts = opts.send(:apply_join_dependency) if opts.eager_loading?`) runs the limited-ids query in line, and `Relation` holds no ivar for it. trails precomputes the ids in `_materializeDeferredDistinctPkPredicates` because the query is async, and parks them on the outer relation as a `[from, ids]` pair that `reset` clears and `initializeCopy` carries.

trails#8827 only made the member dumpable (it was a `WeakMap`, which `Marshal.dump` refuses). It is still written by `Marshal.dump(relation)` as `@_from_limited_ids`, an ivar a Rails-written dump does not have. The story `activerecord-relation-round-trips-marshal` asked for it to be converged away and that part was not done. `relation-initialize-copy-carries-from-limited-ids` covers only the copy semantics.

## Acceptance criteria

- [ ] `Relation` has no `_fromLimitedIds` member: the limited ids an eager `from` relation needs reach `apply_join_dependency` without state on the outer relation, or the remaining state is ruled permanent under packages/activerecord/CLAUDE.md § "Relation is evaluated by an async query" and receipted there.
- [ ] `Marshal.dump` of a relation whose `from` is an eager-loading relation writes no ivar Rails does not write for it.
- [ ] `relation/marshal.trails.test.ts` and the eager `from` subquery tests still pass.
