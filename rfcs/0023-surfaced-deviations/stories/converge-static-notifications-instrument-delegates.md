---
title: "converge-static-notifications-instrument-delegates"
status: claimed
updated: 2026-07-15
rfc: "0023-surfaced-deviations"
cluster: null
deps: []
deps-rfc: []
est-loc: null
priority: null
pr: null
claim: "2026-07-15T22:31:11Z"
assignee: "converge-static-notifications-instrument-delegates"
blocked-by: null
closed-reason: null
---

## Context

Rails' `ActiveSupport::Notifications.instrument`
(`vendor/rails/activesupport/lib/active_support/notifications.rb:208-214`) is a
thin delegator:

```ruby
def instrument(name, payload = {})
  if notifier.listening?(name)
    instrumenter.instrument(name, payload) { yield payload if block_given? }
  else
    yield payload if block_given?
  end
end
```

It owns no timing, no event stack, and no rescue arm — it inherits all of that
from `Instrumenter#instrument` (`notifications/instrumenter.rb:56-67`), and
short-circuits entirely when nothing is listening.

trails' static `Notifications.instrument` / `instrumentAsync`
(`packages/activesupport/src/notifications.ts:111,143`) instead reimplements the
machinery: it builds the `Event` itself, maintains a parallel
`IsolatedExecutionState` event stack, and publishes directly. After #4894
converged the instance `Instrumenter`, the two now diverge from each other:

- the static path has **no `rescue Exception` arm**, so it never sets
  `payload.exception` / `payload.exception_object` — which is why ~16 AR adapter
  sites hand-roll those keys inline (sqlite3, mysql2, postgresql,
  `abstract/database-statements.ts`);
- there is **no `listening?` short-circuit**, so an unlistened event still pays
  for event construction and publish.

This is the path ~151 call sites across the repo actually use, so the static
surface — not the instance one — is where the divergence is load-bearing.

PR #4892 converged the static block to receive the payload, so the yield contract
already matches; the delegation and rescue arm do not.

## Acceptance criteria

- [ ] `Notifications.instrument` delegates to `Instrumenter#instrument` rather
      than reimplementing event construction, the stack, and publish.
- [ ] Port the `notifier.listening?(name)` short-circuit, including the
      block-still-runs-when-unlistened branch.
- [ ] With delegation in place, the static path inherits the rescue arm — audit
      the ~16 adapter sites that hand-roll `payload.exception` /
      `payload.exception_object` and remove the ones the inherited arm now
      covers, so the keys are not set twice.
- [ ] `instrumentAsync` gets the same treatment; note that Rails has no async
      analogue, so it stays a documented trails extension.
- [ ] Existing instrumentation tests keep passing; the AR `sql.active_record`
      subscribers must still observe the exception keys.
