---
title: "decompose-touch-override-chain"
status: draft
updated: 2026-09-12
rfc: "0113-branch-and-guard-parity"
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

`Base#touch` reaches one TS body that carries the arms of **four** Rails methods. trails#7730
moved `touch` into `persistence.ts` and rebuilt the `_touch_row` chain under it
(`Dirty` → `Locking::Optimistic` → `Persistence`), but deliberately left the override chain
_above_ `touch` collapsed. This story converges that.

Rails' MRO for `touch`, nearest first (`activerecord/lib/active_record/base.rb` include order):

| Ruby                      | Arm                                                                                  |
| ------------------------- | ------------------------------------------------------------------------------------ |
| `no_touching.rb:61-63`    | `def touch(*, **); super unless no_touching?; end` (included at `base.rb:323`)       |
| `touch_later.rb:38-50`    | drains `@_defer_touch_attrs`, then `super` (`base.rb:322`)                           |
| `transactions.rb:368-370` | `def touch(*, **); with_transaction_returning_status { super }; end` (`base.rb:321`) |
| `callbacks.rb:431-433`    | `def touch(*, **); _run_touch_callbacks { super }; end` (`base.rb:315`)              |
| `persistence.rb:793-811`  | the implementation (`base.rb:300`)                                                   |

trails today:

- `packages/activerecord/src/touch-later.ts:78` is the `touch_later.rb:38` arm — correct, and it
  is the only override that exists as its own method. `base.ts` wires
  `declare touch: typeof TouchLater.touch`.
- `packages/activerecord/src/persistence.ts`'s `touch` carries the other three arms inline:
  - `if (isNoTouchingApplied(ctor)) return false;` — the `no_touching.rb:61` arm. Note it
    returns `false` where Ruby's `super unless no_touching?` returns `nil`; both are falsy, but
    the guard does not belong in this body at all.
  - `withTransactionReturningStatus.call(this, ...)` wrapping the whole body — the
    `transactions.rb:368` arm.
  - `await runCallbacks(this, "touch")` — the `callbacks.rb:431` arm, which in Rails wraps
    `super` rather than running after the row write.
- `no-touching.ts` and `transactions.ts` have **no** `touch` member, and `callbacks.ts` only
  declares the callback (`defineModelCallbacks("initialize", "find", "touch", { only: "after" })`
  at `:23`) without the wrapper.

## Converged shape

Three new overrides, each the Rails one-liner, composed in `base.ts` the way `_updateRow` and
(since trails#7730) `_touchRow` already are — innermost last:

```ts
// base.ts, nearest-first: NoTouching -> TouchLater -> Transactions -> Callbacks -> Persistence
["touch", function (this: Base, ...args: TouchArgs): Promise<boolean> {
  return NoTouching.touch.call(this, args, () =>
    TouchLater.touch.call(this, args, () =>
      Transactions.touch.call(this, args, () =>
        Callbacks.touch.call(this, args, () => _Persistence.touch.call(this, ...args)))));
}],
```

- `no-touching.ts` gains `touch(args, superFn)` → `isNoTouching(...) ? undefined : superFn()`.
- `transactions.ts` gains `touch(args, superFn)` → `withTransactionReturningStatus.call(this, superFn)`.
- `callbacks.ts` gains `touch(args, superFn)` → `runCallbacks(this, "touch", superFn)`.
- `persistence.ts`'s `touch` drops all three, leaving exactly `persistence.rb:793-811`:
  the two raise guards, the `attribute_names` build, and
  `_touchRow` + `_triggerUpdateCallback`.

`touch-later.ts`'s existing body stays, re-shaped to take `superFn` instead of calling
`persistenceTouch` directly.

## Acceptance criteria

- `no-touching.ts`, `transactions.ts` and `callbacks.ts` each declare a `touch` arm matching
  their Rails one-liner; `persistence.ts`'s `touch` is `persistence.rb:793-811` and nothing else.
- The chain is composed in `base.ts` in `base.rb`'s include order, and
  `pnpm parity:api:extra --package activerecord` gains no row (every name is Rails').
- `pnpm parity:api:calls` stays green — the three new bodies make the calls Rails makes.
- `timestamp.test.ts`, `touch-later.test.ts`, `locking.test.ts`, `no-touching.test.ts`,
  `dirty.test.ts` and `counter-cache.test.ts` stay green; the `no_touching` arm returning
  `undefined` rather than `false` is the one behavioral change to check against
  `vendor/rails/activerecord/test/cases/touch_later_test.rb` and `no_touching_test.rb`.

## Notes

Do not reach for a `@noRailsEquivalent` receipt here: every name involved is a Rails name in a
Rails-matched file, so there is nothing for a receipt to suppress — this is a decomposition
divergence, which is why the extra-surface gate never saw it and trails#7730's measurement was
green with it in place.
