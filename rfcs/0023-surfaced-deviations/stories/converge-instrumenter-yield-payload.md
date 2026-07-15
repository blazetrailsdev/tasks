---
title: "Instrumenter#instrument yields payload, not Event (match Rails)"
status: ready
updated: 2026-07-15
rfc: "0023-surfaced-deviations"
cluster: null
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

Rails' `ActiveSupport::Notifications::Instrumenter#instrument` yields the
**payload** to its block
(`vendor/rails/activesupport/lib/active_support/notifications/instrumenter.rb:24`:
`yield payload if block_given?`), and sets `payload[:exception]` /
`payload[:exception_object]` on raise.

trails has two parallel implementations that now disagree:

- `Notifications.instrument` / `instrumentAsync` (static,
  `packages/activesupport/src/notifications.ts:111,148`) — yields the **payload**
  as of PR #4892, matching Rails.
- `Instrumenter#instrument` / `#instrumentAsync` (instance,
  `packages/activesupport/src/notifications/instrumenter.ts:60,88`) — yields the
  **`Event`** object, not the payload. It also accepts a trails-invented overload
  where the 2nd positional arg may be the callback (`payloadOrFn`), which Rails
  has no analogue for.

Callers of the instance method are `middleware/database-selector/resolver.ts:72,82,92`
— all three pass zero-arg blocks, so converging the yielded value is
non-breaking for current callers.

Neither implementation sets `payload[:exception]` on raise the way Rails'
`Instrumenter#instrument` does; the AR adapters hand-roll that inline instead
(e.g. `sqlite3-adapter.ts` sets `payload.exception` in its own catch).

## Acceptance criteria

- [ ] `Instrumenter#instrument` / `#instrumentAsync` yield the payload, matching
      Rails' `yield payload` — one yield contract across both trails APIs.
- [ ] Decide the fate of the `payloadOrFn` callback-as-2nd-arg overload: either
      drop it (no Rails analogue) or document why it stays.
- [ ] Port the `rescue Exception` arm that sets `payload[:exception]` and
      `payload[:exception_object]`, and reconcile it with the adapters that
      currently hand-roll those keys, so they are not set twice.
- [ ] Update `resolver.ts` callers if the signature changes.
- [ ] Tests: assert a block mutation reaches subscribers, and that a raise
      populates the exception keys. Check existing test BODIES — several tests
      named "yields the payload for further modification" were hollow (they
      passed an empty block and never mutated anything), fixed in #4892.
