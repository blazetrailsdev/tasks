---
title: "async-readers-return-activerecord-promise-for-pending-queries"
status: draft
updated: 2026-10-01
rfc: "0174-activerecord-api-parity-100"
cluster: null
packages: []
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

trails#8342 ported `ActiveRecord::Promise` (`packages/activerecord/src/promise.ts`,
`vendor/rails/v8.0.2/activerecord/lib/active_record/promise.rb`) and returns `Promise::Complete`
from `ids`' `loaded?` arm. Every other `async_*` reader still hands back a native JS promise, so
callers cannot use `pending?`, `value` or the lazy `then`:

- `ids`' query arm (`relation/calculations.rb:394-405`) ends
  `result.then { |result| type_cast_pluck_values(result, columns) }`, where `result` is the
  `FutureResult` `select_all(..., async: @async)` returned. `FutureResult#then`
  (`future_result.rb:81-83`) is `Promise.new(self, block)` and `FutureResult::Complete#then`
  (`future_result.rb:21-23`) is `Promise::Complete.new(@result.then(&block))`.
- `pluck` (`calculations.rb:294,303,318`), `pick` (`:355,358`) and `calculate`
  (`:224,227`) have the same shape.

Two things stand between trails and that shape:

- trails' `ids` reaches the adapter through the async `withConnection`
  (`packages/activerecord/src/relation/calculations.ts`, `ids`), and `FutureResult#then`
  (`packages/activerecord/src/future-result.ts`) is a native thenable, so the promise
  `withConnection` returns unwraps the `FutureResult` before `ids` can hold it. The only
  synchronous route is `ConnectionPool#withConnectionSync`, which CLAUDE.md § "Schema reflection
  peeks at a warm cache" keeps CONVERGEABLE and forbids new uses of.
- `pluck`, `pick` and `calculate` are `async function`s, which unwrap any thenable they return.

## Acceptance criteria

- [ ] `FutureResult#then` and `FutureResult::Complete#then` return `ActiveRecord::Promise` /
      `Promise::Complete`, as `future_result.rb:21-23,81-83` do, while `await futureResult` still
      settles.
- [ ] `asyncIds`, `asyncPluck`, `asyncPick` and the `async_*` calculations return an
      `ActiveRecord::Promise` for an unloaded relation, with no new synchronous lease.
- [ ] The `calculate` / `pluck` `new` rows in
      `scripts/api-compare/call-mismatches-exclude/activerecord/relation/calculations.json` are
      deleted.
