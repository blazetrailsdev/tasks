---
title: "LogSubscriber.LEVEL_CHECKS routes through an invented isLevelEnabled fallback chain instead of the logger's own predicate"
status: done
updated: 2026-08-10
rfc: "0072-api-compare-parity-burndown"
cluster: null
packages: []
deps: []
deps-rfc: []
est-loc: 80
priority: null
pr: 6321
claim: "2026-08-10T02:26:38Z"
assignee: "port-test-date-arith-iteration"
blocked-by: null
closed-reason: null
---

## Context

Found while working `log-subscriber-logger-falls-back-to-the-application-logger`
(#6314). Pre-existing, not introduced there.

Rails' `LEVEL_CHECKS`
(`vendor/rails/activesupport/lib/active_support/log_subscriber.rb:86-90`) is
three lambdas that call the logger's own predicate directly:

```ruby
LEVEL_CHECKS = {
  debug: -> (logger) { !logger.debug? },
  info: -> (logger) { !logger.info? },
  error: -> (logger) { !logger.error? },
}
```

`packages/activesupport/src/log-subscriber.ts:87-90` routes all three through a
trails-invented `isLevelEnabled(logger, level)` helper
(`log-subscriber.ts:14-32`) that tries, in order: a `` `${level}?` `` boolean
property, a `` `${level}Enabled` `` camelCase flag, a numeric `level` field
compared against a hardcoded severity table, and finally "assume enabled". Rails
has no such fallback chain — a logger without `debug?` raises `NoMethodError`
there, and `Logger` (`activesupport/lib/active_support/logger.rb`) always has
the predicates because it is a `::Logger`.

The helper is invented surface with no Ruby counterpart, and its "assume
enabled" tail silently keeps logging on for an object Rails would have failed
on, which hides a mis-wired logger rather than surfacing it.

## Converged shape

`LEVEL_CHECKS` calls the predicate on the logger, as Rails does — trails'
`Logger` defines them as `get "debug?"()` getters, so the call site is a plain
property read:

```ts
static readonly LEVEL_CHECKS: Record<string, (logger: Logger) => boolean> = {
  debug: (logger) => !logger["debug?"],
  info: (logger) => !logger["info?"],
  error: (logger) => !logger["error?"],
};
```

and `isLevelEnabled` is deleted. Callers passing a duck-typed object without the
predicates are the real finding: they should be given a `Logger`, or the
duck-type documented at its own call site — not absorbed by a fallback chain
inside `LogSubscriber`.

## Acceptance criteria

- [ ] `LEVEL_CHECKS` reads the logger's own predicate per
      `log_subscriber.rb:86-90`; no severity table, no `*Enabled` fallback, no
      "assume enabled" tail.
- [ ] `isLevelEnabled` is deleted from `packages/activesupport/src/log-subscriber.ts`.
- [ ] Any caller that was relying on the fallback chain is fixed at the caller,
      not re-absorbed here; `packages/activesupport/src/log-subscriber.test.ts`
      stays green.
