---
title: "exec_main_query returns rows, not records — restore instantiate_records' eager arm"
status: done
updated: 2026-08-16
rfc: "0107-relation-ts-decomposition"
cluster: null
packages: []
deps: []
deps-rfc: []
est-loc: 250
priority: null
pr: 6613
claim: "2026-08-16T21:13:33Z"
assignee: "djar-eager-chain-ids-drop-disable-joins-arms"
blocked-by: null
closed-reason: null
---

## Context

`Relation#exec_main_query` (`vendor/rails/activerecord/lib/active_record/relation.rb:1423-1452`)
returns **rows**; `instantiate_records` (`:1455-1464`) is what turns them into
records, routing the eager case through `@_join_dependency.instantiate(rows,
strict_loading_value)` and everything else through `model._load_from_sql(rows)`.

trails' `execMainQuery` (`packages/activerecord/src/relation.ts`, added by
PR #6604) returns **records** from both arms, because the eager arm hydrates
inside `_executeEagerLoad` — which owns the JoinDependency and instantiates the
parents itself — so there are no rows left to hand back. `instantiateRecords`
therefore only ever sees the non-eager arm's rows, and Rails' eager branch of
`instantiate_records` has no port.

## Converged shape

- `execMainQuery` returns `Record<string, unknown>[]` (rows) on both arms.
- `_executeEagerLoad` stops instantiating: it returns the JOIN rows and stashes
  the JoinDependency where `instantiateRecords` can read it — Rails'
  `@_join_dependency`, set in `apply_join_dependency` (`relation.rb:1438`) and
  cleared by `instantiate_records` (`:1459`).
- `instantiateRecords` grows Rails' `if eager_loading?` branch, calling
  `jd.instantiateFromRows(rows, strictLoadingValue)`.

Pairs with [[split-load-records-out-of-exec-queries]]: both are about
`exec_queries`' three-line body (`exec_main_query` → `instantiate_records` →
`preload_associations`) being fused into trails' load path.

## Acceptance criteria

- [ ] `execMainQuery` returns rows; `instantiateRecords` carries both Rails arms.
- [ ] `pnpm parity:api:calls` / `:args` clean, no new baseline rows.
- [ ] `relations.test.ts`, `relation.test.ts`, `associations/eager.test.ts` and
      `packages/activerecord/src/relation/` pass unchanged on all three adapters.
