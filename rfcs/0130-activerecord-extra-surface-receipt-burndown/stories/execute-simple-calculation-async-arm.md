---
title: "executeSimpleCalculation takes Rails' @async arm (FutureResult.wrap)"
status: done
updated: 2026-09-24
rfc: "0130-activerecord-extra-surface-receipt-burndown"
cluster: null
packages: ["activerecord"]
deps: []
deps-rfc: []
est-loc: 120
priority: 2
pr: trails#8052
claim: "2026-09-24T18:29:09Z"
assignee: "adapter-foreign-key-test-loads-fk-test-has-pk-fixture"
blocked-by: null
closed-reason: null
---

## Context

Rails' `Calculations#execute_simple_calculation`
(`activerecord/lib/active_record/relation/calculations.rb:487-499`) takes an
`@async` arm. A contradiction returns `FutureResult.wrap(Result.empty)`, and
otherwise `select_all` is passed `async: @async`. `async_count` /
`async_average` / … (`:106-165`) reach it through `async.count(column_name)`.

trails' `executeSimpleCalculation` (`relation/calculations.ts`) has no
`@async` arm. It carries `@missingRailsCall wrap — CONVERGEABLE …`, citing
`port-load-async-future-result-for-select-async-arm`, which is closed.
`asyncCount` and its siblings are `return this.count(columnName)`, not
`async.count`. `FutureResult.wrap` is ported (`future-result.ts:119`).
Surfaced by trails#8004. Re-pointed here by
`retire-convergeable-receipts-citing-done-stories`.

## Acceptance criteria

- `executeSimpleCalculation` takes the `@async` arm as Rails does:
  `FutureResult.wrap(Result.empty())` on a contradiction, and `async: this._async`
  to `selectAll`.
- The `async_*` calculation readers go through `async.<op>` as
  `calculations.rb:106-165` does.
- The `@missingRailsCall wrap` receipt is deleted.
