---
title: "Port Duration#sum as a method so since/ago call it"
status: done
updated: 2026-08-18
rfc: "0106-wide-call-set-direct-burndown"
cluster: null
packages: []
deps: []
deps-rfc: []
est-loc: 160
priority: null
pr: 6685
claim: "2026-08-18T02:03:08Z"
assignee: "port-duration-sum-so-since-and-ago-call-it"
blocked-by: null
closed-reason: null
---

# Port `Duration#sum` as a method so `since`/`ago` call it

## Context

`ActiveSupport::Duration` has a private instance method `sum`
(`vendor/rails/activesupport/lib/active_support/duration.rb:486-510`):

```ruby
def sum(sign, time = ::Time.current)
  unless time.acts_like?(:time) || time.acts_like?(:date)
    raise ::ArgumentError, "expected a time or date, got #{time.inspect}"
  end

  if @parts.empty?
    time.since(sign * value)
  else
    @parts.each do |type, number|
      ...
    end
    time
  end
end
```

`since` (`duration.rb:...`) is `sum(1, time)` and `ago` is `sum(-1, time)`.
trails has no `sum` method: the arithmetic lives in the free functions
`applyDuration` / `applyDurationPreservingNs` in
`packages/activesupport/src/duration.ts`, reached from `since`/`ago` directly.

The only TS member named `sum` is `Duration.sum(durations)`, an `@internal`
static Enumerable-style helper with no Rails counterpart, used solely by
`duration.test.ts`. The call-set comparator pairs Ruby's private `sum` with that
static by name, which produces three baseline rows in
`scripts/api-compare/call-mismatches-exclude/activesupport/duration.json`:

- `since | sum` and `ago | sum` — seeded with the wide ratchet; they are the
  genuine "the ported `sum` is never called" signal.
- `sum | empty?` — added in PR #6683 when `isEmpty` moved to activesupport and
  made Ruby `empty?` resolvable in activesupport bodies. Its `reason` records
  the collision.

## Converged shape

- A private `sum(sign, time = Time.current)` on `Duration`, carrying the
  `acts_like?` ArgumentError guard, the `@parts.empty?` arm
  (`time.since(sign * value)`) and the `@parts.each` arm, with the existing
  instant/Date receiver handling folded into it rather than beside it.
- `since` is `sum(1, time)`; `ago` is `sum(-1, time)`.
- The trails-only `static sum(durations)` is removed (it has no Rails
  counterpart), or given a `@noRailsEquivalent` reason if a caller survives —
  its two `duration.test.ts` cases are trails-only and go with it.
- All three baseline rows above are deleted by hand via `serializeBaseline`,
  then `pnpm parity:api:calls:tighten activesupport/duration.json`.

Interacts with `duration-sum-instant-arm-ignores-part-order`
(0023-surfaced-deviations), which converges the same body's part ORDER on the
instant receiver — coordinate so the two do not collide.

## Acceptance criteria

- [ ] `Duration#sum` exists with Rails' name, arity, defaults and guard.
- [ ] `since`/`ago` call it; no behaviour change for either receiver kind.
- [ ] The three `duration.json` rows are deleted; no new row.
- [ ] `pnpm parity:api:calls` / `:args` green; `parity:api` delta non-negative.
