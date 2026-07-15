---
title: "converge-notifications-onto-fanout-notifier"
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

Rails' `Notifications.instrument`
(`vendor/rails/activesupport/lib/active_support/notifications.rb:208-214`) is a
thin delegator that owns no machinery:

```ruby
def instrument(name, payload = {})
  if notifier.listening?(name)
    instrumenter.instrument(name, payload) { yield payload if block_given? }
  else
    yield payload if block_given?
  end
end
```

The behavioural half of that convergence — the `listening?` short-circuit and
the inherited `rescue Exception` arm — landed separately (see
`converge-static-notifications-instrument-delegates`, which also removed the 15
AR adapter sites that hand-rolled `payload.exception` /
`payload.exception_object`). The structural half did not: trails' static
`Notifications.instrument` still builds the `Event`, maintains the stack, and
publishes directly (`packages/activesupport/src/notifications.ts`).

That story originally specified delegating to the instance `Instrumenter`. That
target is **not viable as-is**, and the premise it rested on ("after #4894
converged the instance Instrumenter") is false — no such PR exists; `git log` on
`notifications/instrumenter.ts` stops at #4892. As of that work
`packages/activesupport/src/notifications/instrumenter.ts`:

- has **no rescue arm** (bare try/finally), so delegating inherits nothing;
- yields the **`Event`, not the payload** — delegating would undo #4892;
- keeps an **instance `_stack` array** rather than the AsyncContext-scoped
  `IsolatedExecutionState` stack the static path uses to survive concurrent
  `instrumentAsync` under `Promise.all`;
- has **zero production consumers** (only `notifications.test.ts`).

So the instance class must be converged _first_, and the real blocker is the
notifier: Rails' `Notifications.instrumenter` is
`registry[notifier] ||= Instrumenter.new(notifier)`, and `listening?` lives on
the Fanout. trails has `notifications/fanout.ts` (with `listening()`), but
`Notifications` never uses it — it keeps a private `_subscribers` Set and a
bespoke `_matches`. Converging means migrating `Notifications` onto Fanout as
its notifier, which changes the `subscribe`/`unsubscribe` return shape used
across the repo.

## Acceptance criteria

- [ ] `Notifications` owns a `Fanout` notifier; `subscribe` / `unsubscribe` /
      `publish` / `_listening` route through it instead of the private
      `_subscribers` Set and `_matches`.
- [ ] `Instrumenter#instrument` owns event construction, the stack, publish, and
      the rescue arm, and yields the **payload** (preserving #4892).
- [ ] `Instrumenter` uses the AsyncContext-scoped `IsolatedExecutionState` stack
      so concurrent `instrumentAsync` calls cannot corrupt each other's nesting
      — do not regress to an instance array.
- [ ] Static `Notifications.instrument` becomes the Rails delegator: the
      `listening?` branch plus `instrumenter.instrument(name, payload)`.
- [ ] `instrumentAsync` delegates the same way; it has no Rails analogue and
      stays a documented trails extension.
- [ ] Existing notification tests keep passing unchanged, including
      `nested events can be instrumented` and the AR `sql.active_record`
      exception-key coverage in `instrumentation.trails.test.ts`.

## Notes

May exceed 500 LOC once the Fanout migration touches call sites; split at the
Fanout boundary (migrate the notifier first, then delegate) if so.
