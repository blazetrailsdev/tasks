---
title: "Scope transaction_instrumentation subscribers per test, as Rails' ensure does"
status: in-progress
updated: 2026-09-21
rfc: "0132-ar-closure-assertion-parity"
cluster: null
packages: []
deps: []
deps-rfc: []
est-loc: 110
priority: 7
pr: trails#7929
claim: "2026-09-21T13:56:49Z"
assignee: "port-assert-in-delta-as-indelta-not-operator"
blocked-by: null
closed-reason: null
---

## Context

`packages/activerecord/src/transaction-instrumentation.test.ts` unsubscribes
its notification subscribers with one file-wide hook:

```ts
afterEach(() => {
  Notifications.unsubscribeAll();
  vi.restoreAllMocks();
});
```

Rails does it per test, capturing the subscriber in a local and releasing it in
an `ensure` — every one of the 21 tests in
`vendor/rails/activerecord/test/cases/transaction_instrumentation_test.rb`
carries the clause, e.g. `:10-24`:

```ruby
def test_start_transaction_is_triggered_when_the_transaction_is_materialized
  subscriber = ActiveSupport::Notifications.subscribe("start_transaction.active_record") do |event|
    …
  end
  …
ensure
  ActiveSupport::Notifications.unsubscribe(subscriber)
end
```

and the `transaction.active_record` tests guard it —
`ensure … unsubscribe(subscriber) if subscriber` (`:85-87`, `:109-111`,
`:139-141`, and so on through `:450-452`).

The observable effect is the same today, which is why trails#7898 left it
alone while converging that file's assertions to 0/0/0. It is still a
divergence in decomposition: Rails scopes the subscription to the test that
made it, trails tears down everything the file registered.

## Converged shape

Capture the subscriber and release it in a `finally`, which is the JS analogue
of Ruby's `ensure` at the same granularity:

```ts
const subscriber = Notifications.subscribe("start_transaction.active_record", (event) => {
  …
});
try {
  …
} finally {
  Notifications.unsubscribe(subscriber);
}
```

`Notifications.unsubscribe` already takes the `NotificationSubscriber` handle
that `subscribe` returns — the file's last test,
`transaction instrumentation on broken subscription`, already uses exactly this
pair, so no new surface is needed.

## Acceptance criteria

- Each of the 21 tests captures its own subscriber and releases it in a
  `finally`, mirroring the Rails method it ports (guard with `if subscriber`
  only where Rails does).
- The file-wide `Notifications.unsubscribeAll()` in `afterEach` is gone;
  `vi.restoreAllMocks()` may stay (it has no Rails counterpart to mirror).
- `pnpm parity:test -- --package activerecord --assertions` still reports
  `transaction_instrumentation_test.rb` at 0 assertion mismatches.
