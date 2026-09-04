---
title: "Delete Notifications.instrumentAsync now that the unified Instrumenter#instrument covers an async block"
status: ready
updated: 2026-09-04
rfc: "0123-blocked-convergence-holding"
cluster: null
packages: []
deps: []
deps-rfc: []
est-loc: 90
priority: null
pr: null
claim: null
assignee: null
blocked-by: null
closed-reason: null
---

## Context

`ActiveSupport::Notifications.instrument`
(`vendor/rails/activesupport/lib/active_support/notifications.rb:208-214`) is
ONE Ruby method:

```ruby
def instrument(name, payload = {})
  if notifier.listening?(name)
    instrumenter.instrument(name, payload) { yield payload if block_given? }
  else
    yield payload if block_given?
  end
end
```

trails carries a second static method beside it,
`Notifications.instrumentAsync` (`packages/activesupport/src/notifications.ts:256`),
tagged `@noRailsEquivalent` — an invented public synonym with no Ruby
counterpart.

It existed because the instance method it delegated to was itself split.
PR #7452 (`unify-instrumenter-instrument-sync-and-async-arms`) removed that
split: `Instrumenter#instrument` (`notifications/instrumenter.rb:54-65`) and
`Event#record` (`instrumenter.rb:132-143`) are each a single non-async body at
the Rails name, returning `T` where `T` may be a Promise, with the `ensure` and
`rescue` arms landing on the settled promise when the block returns one
(discriminated by `instanceof Promise`). `Notifications.instrumentAsync` now
does nothing its sync twin cannot: it delegates to the same unified
`instrument` at `notifications.ts:265` and differs only by `await`ing.

That PR deliberately left it in place — its story scoped the removal out — so
the synonym is now unbacked extra surface that the unification made redundant.

## Converged shape

Delete `Notifications.instrumentAsync` and its `@noRailsEquivalent` receipt.
`Notifications.instrument` already covers an async block: it short-circuits on
`listening?` and otherwise hands the block to the unified
`Instrumenter#instrument`, which returns the block's Promise. Callers keep their
`await`; only the method name changes.

Call sites to move (`instrumentAsync` -> `instrument`):

- `packages/actionpack/src/action-controller/base.ts:678`
- `packages/actionpack/src/action-controller/metal/instrumentation.ts:48`
- `packages/actionpack/src/action-controller/metal/rate-limiting.ts:292`
- `packages/trailties/src/engine.ts:212` (and the prose at `:201`)
- tests: `packages/actionpack/src/action-dispatch/middleware/server-timing.test.ts`
  (4 sites), `packages/activesupport/src/notifications.test.ts:315`,
  `packages/activesupport/src/notifications.trails.test.ts` (the
  `instrumentAsync` describe and its cases — that file's header comment names
  `instrumentAsync` as a trails extension and needs the same edit)

Check `Notifications.instrument`'s declared return type while you are there: it
is currently cast (`as any`, `notifications.ts:241`) and should express
`T | Promise<T>` the way the instance method does, so an awaiting caller
type-checks without the cast.

## Acceptance criteria

- No `instrumentAsync` remains in `packages/`, in source or tests.
- `Notifications.instrument` is the single static entry point, matching
  `notifications.rb:208-214`, and typed so an async block's caller can `await`
  it without a cast.
- One fewer `@noRailsEquivalent` receipt in activesupport; no baseline row
  added, no mark raised.
- `pnpm parity:api:calls`, `:calls:args`, `:params` and `parity:api:extra:gate`
  clean.
