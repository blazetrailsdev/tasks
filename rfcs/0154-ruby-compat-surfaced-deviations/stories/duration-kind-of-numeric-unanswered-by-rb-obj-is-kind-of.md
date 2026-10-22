---
title: "duration-kind-of-numeric-unanswered-by-rb-obj-is-kind-of"
status: draft
updated: 2026-10-22
rfc: "0154-ruby-compat-surfaced-deviations"
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

Rails' `ActionCable::Channel::PeriodicTimers::ClassMethods#periodically`
(`vendor/rails/v8.0.2/actioncable/lib/action_cable/channel/periodic_timers.rb:47`)
guards `every.kind_of?(Numeric) && every > 0`, and `periodic_timers_test.rb`
passes `1.second`: an `ActiveSupport::Duration` answers `kind_of?(Numeric)`
true through `Duration#is_a?` (`vendor/rails/v8.0.2/activesupport/lib/active_support/duration.rb:330-333`,
`Duration == klass || value.is_a?(klass)`).

In trails neither path answers it:

- `rbObjIsKindOf(Duration.seconds(1), rbCNumeric)` (`packages/ruby-compat/src/include.ts:1268`)
  is `false`: it is `rb_obj_is_kind_of`, which does not dispatch to a
  receiver's overridden `kind_of?`, and `Duration` is not in `Numeric`'s ancestry.
- `Duration#isA` / `isKindOf` (`packages/activesupport/src/duration.ts:439`) is
  `Duration === klass || Object(this.value) instanceof klass`, and
  `rbCNumeric` is not a JS constructor a `Number` wrapper is an instance of, so
  `isKindOf(rbCNumeric)` is `false` too.
- `rbFSend(duration, "kind_of?", rbCNumeric)` raises `NoMethodError`.

So `periodically(":foo", { every: Duration.seconds(1) })` in
`packages/actioncable/src/channel/periodic-timers.ts` raises "Expected every:
to be a positive number of seconds" where Rails accepts it.

## Acceptance criteria

- `Duration#isA(rbCNumeric)` answers `true`, by `value.is_a?(klass)` through
  `rbObjIsKindOf(this.value, klass)` as Rails' body reads.
- A Rails `x.kind_of?(Numeric)` call site written as `rbObjIsKindOf(x, rbCNumeric)`
  answers `true` for a Duration, by the mechanism CLAUDE.md § "Ruby protocol
  methods with a different JS mechanism" names for `is_a?` (a hook on the class
  tested against), not an `instanceof Duration` arm at each call site.
- `periodically(":sendUpdates", { every: Duration.seconds(1) })` is accepted,
  asserted in `packages/actioncable/src/channel/periodic-timers.trails.test.ts`.
