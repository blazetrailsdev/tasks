---
title: "split-load-records-out-of-exec-queries"
status: done
updated: 2026-08-18
rfc: "0107-relation-ts-decomposition"
cluster: null
packages: []
deps: []
deps-rfc: []
est-loc: null
priority: null
pr: 6686
claim: "2026-08-18T02:31:51Z"
assignee: "invert-where-chain-trio-onto-wherechain"
blocked-by: null
closed-reason: null
---

## Context

`port-explain-proxy-chainable-relation-explain` landed `ExplainProxy`
(`packages/activerecord/src/relation.ts`), whose `inspect` calls the relation's
`execQueries` directly the way relation.rb:13 does. It could not, however, drop
the load-cache snapshot/restore that story asked for.

Rails' `exec_queries` (relation.rb:1425) is
`skip_query_cache_if_necessary { instantiate_records(exec_main_query, &block) }`
and never touches `@records` — the assignment lives in `#load`
(relation.rb:1179). trails' `_toArrayInner` IS this relation's
`exec_main_query`, but it ends in `loadRecords`, which sets `_loaded` /
`_records`. So `Relation#execQueries` snapshots and restores that state around
the call to keep `.explain` side-effect-free (pinned by explain.test.ts's
"does not load the relation as a side effect").

Two consequences to converge:

- `Relation#execQueries` (`relation.ts`) carries a snapshot/restore Rails has no
  counterpart for.
- The baseline row `relation.ts exec_queries instantiate_records` in
  `scripts/api-compare/call-mismatches-exclude/activerecord/relation.json` is
  open because the instantiation happens inside `_toArrayInner` rather than in
  `exec_queries`.

`_toArrayInner` calls `loadRecords` at three sites (the contradiction
short-circuit and the two load arms) and the surrounding `_loadToken` /
`_loadAsyncPromise` bookkeeping has to keep working, so this is a load-path
refactor, not a one-liner.

## Acceptance criteria

- [ ] `_toArrayInner` returns records without writing the load cache; `toArray`
      / `load` own the `loadRecords` call, as relation.rb:1179 does.
- [ ] `Relation#execQueries` is
      `skipQueryCacheIfNecessary(() => instantiateRecords(execMainQuery()))`
      with no snapshot/restore, and the now-unreachable `execMainQuery` /
      `instantiateRecords` stubs in `relation.ts` are reconciled with the real
      path rather than left as dead divergent bodies.
- [ ] The `exec_queries instantiate_records` baseline row is deleted by hand;
      stale marks fixed with `pnpm parity:api:calls:tighten <shard>`.
- [ ] explain.test.ts's "does not load the relation as a side effect" still
      passes with no snapshot in `execQueries`.
- [ ] SQLite, PostgreSQL and MySQL/MariaDB lanes green.
