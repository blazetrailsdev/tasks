---
title: "Port settable Notifications.notifier + instrumenter registry (or skip-group the static deviation)"
status: ready
updated: 2026-07-19
rfc: "0023-surfaced-deviations"
cluster: null
deps: []
deps-rfc: []
est-loc: 60
priority: null
pr: null
claim: null
assignee: null
blocked-by: null
closed-reason: null
---

## Context

api:compare reports `notifications.rb` at 8/11 methods — the three unmatched are
`notifier`, `notifier=`, and `registry`
(`vendor/rails/activesupport/lib/active_support/notifications.rb:198-266`).
trails models `ActiveSupport::Notifications` as a static class with a private
`_notifier = new Fanout()` built at class-init and a single `_boundInstrumenter`
(`packages/activesupport/src/notifications.ts:46-47`); Rails is a module with
`attr_accessor :notifier` and a per-notifier `instrumenter` registry backed by
`IsolatedExecutionState[:active_support_notifications_registry]`.

This is the #4913 static-class deviation. It blocks faithfully porting Rails
tests that swap the notifier, e.g. `test_subscribing_to_instrumentation_while_
inside_it` does `ActiveSupport::Notifications.notifier =
ActiveSupport::Notifications::Fanout.new` before subscribing
(`vendor/rails/activesupport/test/notifications_test.rb:239-256`); trails'
version approximates it without a real swap.

## Acceptance criteria

- [ ] Either expose a settable `notifier` (with `instrumenter` resolved through
      a per-notifier registry, so swapping the notifier rebinds the
      instrumenter) — mirroring Rails — or, if the static singleton is an
      intentional keep, add `SKIP_GROUPS` entries with a documented reason in
      `scripts/api-compare/conventions.ts` for `notifier` / `notifier=` /
      `registry`.
- [ ] If the settable path is taken, port `test_subscribing_to_instrumentation_
  while_inside_it` with a real `notifier = Fanout.new` swap.
- [ ] api:compare delta on `notifications.rb` non-negative.
