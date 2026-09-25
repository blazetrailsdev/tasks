---
title: "asyncPluck/asyncPick/asyncIds go through async.<op>; pluck/ids take Rails' @async arm"
status: claimed
updated: 2026-09-25
rfc: "0130-activerecord-extra-surface-receipt-burndown"
cluster: null
packages: []
deps: []
deps-rfc: []
est-loc: 80
priority: 5
pr: null
claim: "2026-09-25T02:10:13Z"
assignee: "async-pluck-pick-ids-take-async-arm"
blocked-by: null
closed-reason: null
---

## Context

Rails' `async_pluck`, `async_pick` and `async_ids` (`vendor/rails/activerecord/lib/active_record/relation/calculations.rb:334-336,363-365,409-411`) are `async.pluck(*column_names)`, `async.pick(*column_names)` and `async.ids`.

In trails (`packages/activerecord/src/relation/calculations.ts`), `asyncPluck` is `this.pluck(...)`, `asyncPick` is `this.pick(...)`, and `asyncIds` is `Promise.resolve(this.ids())`. None of them sets `_async`, so the `async:` flag never reaches `selectAll`.

trails#8052 already converged `asyncCount` / `asyncAverage` / `asyncMinimum` / `asyncMaximum` / `asyncSum` (`:106-165`). The `pluck` and `ids` bodies do not pass `async: @async` to `select_all` yet. Rails passes it in `pluck` (`calculations.rb` pluck body, `c.select_all(relation.arel, "#{model.name} Pluck", async: @async)`) and in `ids`.

## Acceptance criteria

- `asyncPluck` / `asyncPick` / `asyncIds` are `this.async().pluck(...)` / `.pick(...)` / `.ids()`.
- The `pluck` and `ids` bodies take Rails' `@async` arm: `FutureResult.wrap(Result.empty())` on a contradiction when `_async` is set, and `{ async: this._async }` passed to `selectAll`, as `execute_simple_calculation` does.
- No new call or args rows.
