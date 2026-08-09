---
title: "LogSubscriber.logger falls back to Trails.logger via the slot"
status: ready
updated: 2026-08-09
rfc: "0072-api-compare-parity-burndown"
cluster: null
packages: []
deps: []
deps-rfc: []
est-loc: 50
priority: null
pr: null
claim: null
assignee: null
blocked-by: null
closed-reason: null
---

## Context

`LogSubscriber.logger`
(`packages/activesupport/src/log-subscriber.ts:92-100`) is a bare
`_logger` slot that returns `null` until something assigns it. Rails
(`vendor/rails/activesupport/lib/active_support/log_subscriber.rb:93-99`) falls
back to the application logger:

```ruby
def logger
  @logger ||= if defined?(Rails) && Rails.respond_to?(:logger)
    Rails.logger
  end
end
```

That arm was dropped because activesupport had no handle on `Rails.logger`.
PR #6282 removed the blocker: `Trails.logger` now stores itself in
`packages/activesupport/src/trails-logger-slot.ts`, a zero-import slot readable
from inside activesupport at call time (the same shape Deprecation's `:log`
behavior now uses, `deprecation.ts` `DEFAULT_BEHAVIORS`).

## Converged shape

```ts
static get logger(): Logger | null {
  return (this._logger ??= (trailsLogger as Logger | null));
}
```

Note Rails memoizes with `||=`, so a later `Trails.logger =` does not
retroactively change a subscriber that already read it — keep that, and keep
`attr_writer :logger` (`:105`) winning over the fallback.

## Acceptance criteria

- [ ] `LogSubscriber.logger` returns the application logger when one is set and
      nothing has been assigned directly, per `log_subscriber.rb:93-99`.
- [ ] The memoization is Rails' `||=`, not a live read.
- [ ] An explicit `LogSubscriber.logger =` still wins.
