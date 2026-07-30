---
title: "Query assertions: schema toggle should be a defaulted option, not a required positional"
status: draft
updated: 2026-07-30
rfc: "0023-surfaced-deviations"
cluster: null
deps: []
deps-rfc: []
est-loc: 120
priority: null
pr: null
claim: null
assignee: null
blocked-by: null
closed-reason: null
---

## Context

Rails' query assertions take the schema toggle as a **defaulted keyword arg**
(`vendor/rails/activerecord/lib/active_record/testing/query_assertions.rb:18`):

```ruby
def assert_queries_count(count = nil, include_schema: false, &block)
  ActiveRecord::Base.lease_connection.materialize_transactions
  ...
```

so every Rails call site reads `assert_queries_count(1) { ... }`.

trails made it a **required positional middle parameter**
(`packages/activerecord/src/testing/query-assertions.ts:60-64`):

```ts
export async function assertQueriesCount(
  count: number | undefined,
  includeSchema = false,
  fn: () => void | Promise<void>,
): Promise<void>;
```

Because `fn` sits third, the default on `includeSchema` is unreachable: callers
must write `assertQueriesCount(1, false, fn)`. Passing the Rails-shaped
`assertQueriesCount(1, fn)` fails at runtime with `TypeError: block is not a
function` from `Notifications.subscribed` — a confusing failure that surfaced
while porting a test on #5623. `assertNoQueries(includeSchema, fn)`,
`assertQueriesMatch`, and `assertNoQueriesMatch` share the shape.

Separately, the port omits Rails' `materialize_transactions` call on line 19, so
a lazily-started transaction can be counted as a query inside the block rather
than being flushed before counting.

## Acceptance criteria

- The schema toggle moves out of the positional path — trailing options object
  (`assertQueriesCount(1, fn)` / `assertQueriesCount(1, fn, { includeSchema:
true })`) or equivalent — so Rails-shaped call sites work and the default is
  reachable. Apply to `assertQueriesCount`, `assertNoQueries`,
  `assertQueriesMatch`, `assertNoQueriesMatch`.
- `materializeTransactions` is invoked before counting, mirroring
  `query_assertions.rb:19`.
- Existing call sites updated; `pnpm api:compare --arity` shows no new arity
  mismatch for these four.
