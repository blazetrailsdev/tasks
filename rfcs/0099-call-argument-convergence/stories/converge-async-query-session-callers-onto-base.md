---
title: "Async-query session/tracker call sites still use core.ts free functions, not Base"
status: done
updated: 2026-08-14
rfc: "0099-call-argument-convergence"
cluster: null
packages: []
deps: []
deps-rfc: []
est-loc: 90
priority: null
pr: 6536
claim: "2026-08-14T18:52:12Z"
assignee: "converge-async-query-session-callers-onto-base"
blocked-by: null
closed-reason: null
---

## Context

Surfaced in PR #6532, which added `Base.asynchronousQueriesSession()` /
`Base.asynchronousQueriesTracker()` as statics on `Base` (base.ts, right after
`connectionHandler`) to match where Rails puts them.

Rails reaches the session through `Base`. The async read path is
`vendor/rails/activerecord/lib/active_record/connection_adapters/abstract/database_statements.rb:687`:

```ruby
future_result.schedule!(ActiveRecord::Base.asynchronous_queries_session)
```

and the two other call sites do the same —
`vendor/rails/activerecord/lib/active_record/asynchronous_queries_tracker.rb:37`
(`ActiveRecord::Base.asynchronous_queries_tracker.tap(&:start_session)`) and
`vendor/rails/activerecord/lib/active_record/test_fixtures.rb:161`,`:165`.
They are defined in `Core`'s `included do` block
(`vendor/rails/activerecord/lib/active_record/core.rb:141-148`), which is why
they are singleton methods on `Base` rather than module functions.

trails still calls the free functions from `core.ts` at those sites:

- `packages/activerecord/src/connection-adapters/abstract/database-statements.ts:38`
  imports `asynchronousQueriesSession` from `../../core.js` and calls it bare at
  `:2200`.
- `packages/activerecord/src/asynchronous-queries-tracker.ts` imports
  `asynchronousQueriesTracker` from `./core.js` and calls it bare in `run()`.

The `Base` statics landed in #6532 but the call sites were deliberately left
alone to keep that PR's scope to its claimed stories. Converging them is the
remaining half.

## Acceptance criteria

1. `database-statements.ts:2200` calls `Base.asynchronousQueriesSession()` as
   `database_statements.rb:687` does, rather than the bare `core.ts` function.
2. `AsynchronousQueriesTracker.run` calls `Base.asynchronousQueriesTracker()` as
   `asynchronous_queries_tracker.rb:37` does.
3. Reaching `Base` from either file must not add a load-time import edge into
   `base.ts` — `scripts/test-deps/base-import-cycle.test.ts` stays green. Use the
   `_registerBase` call-time registration `base.ts` pushes at the bottom of its
   own body, as `schema-migration.ts` and (since #6532) `query-cache.ts` do.
4. `pnpm parity:api:calls` / `parity:api:calls:args` stay green; this should
   retire rows rather than add any.
5. `packages/trailties/src/application/executor-seam.trails.test.ts` and
   `future-result.trails.test.ts` stay green.
