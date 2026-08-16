---
title: "route-to-array-through-exec-queries"
status: done
updated: 2026-08-16
rfc: "0107-relation-ts-decomposition"
cluster: null
packages: []
deps: []
deps-rfc: []
est-loc: null
priority: null
pr: 6604
claim: "2026-08-16T19:43:25Z"
assignee: "burn-down-in-closure-inflections-and-descendants-tracker"
blocked-by: null
closed-reason: null
---

## Context

`Relation#exec_queries` / `#exec_main_query` (relation.rb:1403-1452) have ports
in `packages/activerecord/src/relation.ts` (`execQueries`, `execMainQuery`,
`instantiateRecords`), but nothing calls them: the real load path is inlined in
`toArray()` (relation.ts:2330-2430), which duplicates the same sequence — main
query, instantiate, preload, readonly/strict_loading flags.

Surfaced in review of PR #6604, which converged `execQueries`' body to Rails'
(it was missing `preload_associations` and the readonly/strict_loading arms)
but left the routing alone as out of scope.

Two ported bodies for one Rails method means the one `parity:api` scores is not
the one that runs, so a divergence in the live path is invisible to the gates.

## Acceptance criteria

- `toArray()` routes through `execQueries` / `execMainQuery` (Rails: `load` →
  `exec_queries`, relation.rb:1256-1259), rather than inlining a second copy.
- No behavioural change: `relations.test.ts`, `relation.test.ts`,
  `relation-exec-main-query.test.ts` and `packages/activerecord/src/relation/`
  pass unchanged on all three adapters.
- `pnpm parity:api:calls` / `:args` clean; `parity:api` delta non-negative.
