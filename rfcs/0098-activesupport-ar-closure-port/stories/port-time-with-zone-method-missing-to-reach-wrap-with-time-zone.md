---
title: "Port TimeWithZone#method_missing so the ported wrap_with_time_zone has its Rails caller"
status: claimed
updated: 2026-08-21
rfc: "0098-activesupport-ar-closure-port"
cluster: null
packages: []
deps: []
deps-rfc: []
est-loc: 160
priority: null
pr: null
claim: "2026-08-21T18:50:32Z"
assignee: "converge-association-primary-key-onto-rails-argument-shape"
blocked-by: null
closed-reason: null
---

# `TimeWithZone#wrap_with_time_zone` is ported but unreachable until `method_missing` is

## Context

PR #6825 ported `wrap_with_time_zone`
(`activesupport/lib/active_support/time_with_zone.rb:593-602`) as
`_wrapWithTimeZone` (`packages/activesupport/src/time-with-zone.ts:222-241`),
because the story that widened the constructor listed it among the four helpers
that hang off it. Its body is faithful — the `acts_like?(:time)` arm, the
`periods.include?(period) ? period : nil` decision, and the `..` Range arm that
rebuilds an inclusive range whatever the source was.

It has exactly one caller: itself, recursing over a Range. Rails' real caller is
`method_missing` (`time_with_zone.rb:553-557`):

```ruby
def method_missing(...)
  wrap_with_time_zone time.__send__(...)
rescue NoMethodError => e
  raise e, e.message.sub(time.inspect, inspect).sub("Time", "ActiveSupport::TimeWithZone"), e.backtrace
end
```

which trails does not port. So every Time method trails has not explicitly
defined on `TimeWithZone` is simply absent, where Rails forwards it to the
underlying `Time` and re-wraps a Time-ish result back into a `TimeWithZone`.

## Converged shape

Port `method_missing` — a `Proxy` on `TimeWithZone`, or the settled trails
`method_missing` idiom if one already exists in the package — forwarding to
`time` and passing the result through `_wrapWithTimeZone`, including the
`NoMethodError` message rewrite (`Time` → `ActiveSupport::TimeWithZone`). That
makes the ported helper live and closes the "unknown Time method" gap in one
move.

Check `time-with-zone-residue-structural-blockers` (same RFC) first — the
`method_missing` blocker may already be enumerated there, in which case fold this
in rather than duplicating.

## Acceptance criteria

- [ ] `method_missing` ported at its Rails name, forwarding through
      `_wrapWithTimeZone`, with the error-message rewrite.
- [ ] A test covers a Time method trails does NOT define reaching through and
      coming back as a `TimeWithZone`, and the Range arm returning an inclusive
      range.
- [ ] `parity:api` AR-closure rollup does not regress.
