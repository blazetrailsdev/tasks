---
title: "Converge select_all's Result.empty(async:) call-arg row (needs FutureResult)"
status: done
updated: 2026-08-14
rfc: "0099-call-argument-convergence"
cluster: null
packages: []
deps: []
deps-rfc: []
est-loc: 500
priority: null
pr: 6515
claim: "2026-08-14T03:27:07Z"
assignee: "call-args-ar-select-all-empty-async-row"
blocked-by: null
closed-reason: null
---

## Context

PR #6501 converged three of the four RFC 0095 call-argument rows on
`connection-adapters/abstract-adapter.ts` that drop Rails' `async:` kwarg:
`select_one`/`select_value`/`select_rows` now forward it exactly as Rails does
(`vendor/rails/activerecord/lib/active_record/connection_adapters/abstract/database_statements.rb:85,90,102`).

One row survives, plus the infrastructure the kwarg needs to mean anything:

- `select_all` rescues `::RangeError` with `ActiveRecord::Result.empty(async: async)`
  (`database_statements.rb:78-79`). Rails' `Result.empty(async:)` is a two-arm
  dispatch (`result.rb:94-100`) returning `EMPTY_ASYNC = FutureResult.wrap(EMPTY)`
  (`result.rb:247`). trails has no `EMPTY_ASYNC`, so giving `Result.empty` the
  kwarg with one arm to return would be a stub, not a convergence.
- `select_all` passes `async: async && FutureResult::SelectAll` into `select`
  (`database_statements.rb:74`); `FutureResult::SelectAll` owns the RangeError
  empty-result path (`future_result.rb:173`).
- `select` raises `AsynchronousQueryInsideTransactionError` inside a joinable
  transaction, then schedules or executes the FutureResult
  (`database_statements.rb:671-699`), gated on `async_enabled?` →
  `pool.async_executor` (`abstract_adapter.rb:562`). trails defers that guard at
  `packages/activerecord/src/connection-adapters/abstract/database-statements.ts`
  (the `select` JSDoc note).
- `selectAll` currently accepts `async` and does not act on it — see the call-site
  note above its `try` block. That inertness is what this story retires.

Blocking dependency to resolve first: `future_result.rb`, `promise.rb`, and
`asynchronous_queries_tracker.rb` are permanently excluded in
`scripts/parity/unported-files/unscoped.ts:16-35`, on the grounds that Ruby's
Mutex / thread-pool / `Concurrent::*` primitives collapse into the native Promise
every trails select already returns. Converging this row means reversing or
narrowing those entries — that is a maintainer decision, not a drive-by.

STALE-REF HAZARD, do this part first and cheaply: the surviving baseline row's
`reason` in
`scripts/api-compare/call-mismatches-exclude/activerecord/connection-adapters/abstract-adapter.json`
cites the now-merged story `call-args-ar-select-async-kwarg`. Once that story is
marked done, the citation points at a closed story and the stale-refs check reds.
Repoint it at this story id in a one-line change.

## Acceptance criteria

1. The surviving row's `reason` no longer cites the closed
   `call-args-ar-select-async-kwarg`; it cites this story. (One line; unblocks
   stale-refs immediately, independent of the rest.)
2. `FutureResult`, `FutureResult::SelectAll`, and the `load_async` infrastructure
   are ported (or the maintainer records a decision that they stay unported and
   this row is retired as a permanent language-shortcoming deviation).
3. `Result.empty({ async })` returns the `EMPTY_ASYNC` equivalent for the async arm
   (`result.rb:94-100,247`), and `selectAll` acts on the `async` it already accepts
   rather than ignoring it.
4. `AsynchronousQueryInsideTransactionError` is raised per
   `database_statements.rb:672-674`, replacing the deferral note on `select`.
5. The `select_all` → `empty` `kind: "args"` row is deleted from the baseline
   (only-shrink; no `--write`).
