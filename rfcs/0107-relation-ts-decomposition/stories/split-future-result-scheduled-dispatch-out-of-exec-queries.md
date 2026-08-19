---
title: "Split @future_result/scheduled? out of execQueries so loadAsync calls execMainQuery directly"
status: in-progress
updated: 2026-08-19
rfc: "0107-relation-ts-decomposition"
cluster: null
packages: []
deps: []
deps-rfc: []
est-loc: 300
priority: null
pr: 6750
claim: "2026-08-19T23:26:39Z"
assignee: "split-future-result-scheduled-dispatch-out-of-exec-queries"
blocked-by: null
closed-reason: null
---

# Split `@future_result` / `scheduled?` out of `execQueries` so `loadAsync` calls `execMainQuery` directly

## Context

Follow-up to `thread-async-through-exec-main-query-argument` (PR #6744), which
converged `_asyncLoad` from a field into Rails' `exec_main_query(async:)`
argument but had to thread it through two methods Rails never threads it
through.

Rails' `load_async` calls `exec_main_query(async: !c.current_transaction
.joinable?)` **directly** and never routes through `exec_queries`
(`vendor/rails/activerecord/lib/active_record/relation.rb:1138-1155`, the call
at `:1142`). It can do that because `load_async` only has to park the
`FutureResult` in `@future_result` and set `@loaded`; the rest of the load —
`future.result`, `instantiate_records`, `preload_associations`, the
`readonly!` / `strict_loading!` passes — runs later on the foreground pass,
dispatched by `scheduled?` (`relation.rb:1403-1421`, the `if scheduled?` arm at
`:1405-1409`). `exec_queries` therefore calls `exec_main_query` bare
(`relation.rb:1408`) and `exec_main_query`'s own default is `async: false`
(`relation.rb:1423`).

trails has no such split. Instantiation, eager loading and preloading are all
awaited inside `execQueries` (`packages/activerecord/src/relation.ts`,
`execQueries`), and `_loadAsyncPromise` stands in for `@future_result` because
the in-flight handle a second caller joins has to cover all of those steps, not
just the rows. So PR #6744 threaded `async` as a parameter down
`toArray(async = false)` -> `execQueries(async = false)` ->
`execMainQuery(async = false)` instead.

Two costs are on the books because of it:

- `toArray` is public (`Mirrors: ActiveRecord::Relation#to_a / #load`) and now
  accepts an argument no Rails caller of `to_a` ever passes. It is not scored
  as extra surface and the advisory arity gate does not flag it, but it is
  still surface Rails does not have.
- One `kind: "args"` row in
  `scripts/api-compare/call-mismatches-exclude/activerecord/relation.json`
  (`exec_queries` -> `exec_main_query`), because trails' `execQueries` passes
  `async` where `relation.rb:1408` passes nothing.

## Converged shape

Give trails the dispatch Rails has, then take the parameters back out:

- Hold the scheduled query the way Rails does — a `_futureResult`-shaped handle
  covering the ROWS only (`relation.rb:1142-1149`), not the whole load.
- Port `scheduled?` (`relation.rb:1405`) and give `execQueries` the `if
scheduled?` arm that drains it instead of calling `execMainQuery`
  (`relation.rb:1405-1409`).
- `loadAsync()` then calls `execMainQuery(async: ...)` itself, matching
  `relation.rb:1142`, and `reset()` drops the handle the way
  `relation.rb:1195-1196` does (`@future_result&.cancel; @future_result = nil`).
- Delete the `async` parameters from `toArray` and `execQueries`, restoring
  `execMainQuery(async)`'s Rails-only caller.
- Delete the `exec_queries` -> `exec_main_query` `args` baseline row (by hand —
  the baseline is only-shrink, no reseed) and tighten the mark shard with
  `pnpm parity:api:calls:args`.

The `_loadAsyncPromise` memoization is a separate concern (it also serves
concurrent `toArray()` callers) and should be reconciled with, not replaced by,
the future-result handle.

## Acceptance criteria

- [ ] `loadAsync()` calls `execMainQuery` directly, as `relation.rb:1142` does.
- [ ] `execQueries` has the `scheduled?` arm and calls `execMainQuery` with no
      arguments, as `relation.rb:1408` does.
- [ ] `toArray` and `execQueries` no longer take an `async` parameter.
- [ ] The `exec_queries` -> `exec_main_query` `args` baseline row is deleted,
      not rewritten.
- [ ] `relation-load-async.trails.test.ts` and `asynchronous-queries.test.ts`
      green on all three lanes; `parity:api` `relation.rb` -> `relation.ts`
      stays 401/401; `parity:api:calls` / `:args` / `:extra` clean.
