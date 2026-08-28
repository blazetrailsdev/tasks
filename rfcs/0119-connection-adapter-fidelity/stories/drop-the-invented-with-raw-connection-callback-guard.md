---
title: "with_raw_connection carries a callback guard Rails has no counterpart for"
status: draft
updated: 2026-08-28
rfc: "0119-connection-adapter-fidelity"
cluster: null
packages: []
deps: []
deps-rfc: []
est-loc: 40
priority: null
pr: null
claim: null
assignee: null
blocked-by: null
closed-reason: null
---

## Context

Rails' `with_raw_connection` has no callback guard — a missing block is a plain
`LocalJumpError` from `yield`:

```ruby
# vendor/rails/activerecord/lib/active_record/connection_adapters/abstract_adapter.rb:983
def with_raw_connection(allow_retry: false, materialize_transactions: true)
  @lock.synchronize do
    ...
```

`packages/activerecord/src/connection-adapters/abstract-adapter.ts:1801-1803`
opens with invented surface Rails has no counterpart for:

```ts
if (typeof block !== "function") {
  throw new TypeError("withRawConnection requires a callback");
}
```

PR #7171 removed the union-typed `optsOrCallback` first parameter that made the
guard load-bearing (the port could not otherwise tell an options object from a
callback). With the signature now `(options, block)`, TypeScript rejects a
missing callback at compile time and the guard only fires for `any`-erased
callers — an error message Rails never emits.

It is pinned by a trails-only test, so removing it is not a one-line delete:
`connection-adapters/abstract-adapter.lifecycle.trails.test.ts:74-78`
(`"withRawConnection rejects when no callback is provided"`), which asserts
`/withRawConnection requires a callback/`.

## Converged shape

Drop the guard and let the call reach `block(...)`, which throws the JS analogue
of Ruby's `LocalJumpError` at the same point Rails does — the same reasoning
CLAUDE.md records for zero-import slot reads ("a slot read carries no guard,
because the Ruby body it mirrors carries none"). Retire the pinning test with it,
or reduce it to asserting that some `TypeError` escapes rather than trails'
bespoke message.

## Acceptance criteria

- The `TypeError("withRawConnection requires a callback")` throw is gone from
  `abstract-adapter.ts`.
- The pinning test is retired or rewritten to stop asserting an invented message.
- `pnpm parity:api:extra --package activerecord` shows no new novel name; AR suite
  green on all three lanes.
