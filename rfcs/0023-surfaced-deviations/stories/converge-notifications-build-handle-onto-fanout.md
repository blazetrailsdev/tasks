---
title: "Converge Notifications.buildHandle/instrumenter onto the Fanout notifier"
status: claimed
updated: 2026-07-16
rfc: "0023-surfaced-deviations"
cluster: null
deps:
  - converge-notifications-onto-fanout-notifier
deps-rfc: []
est-loc: 60
priority: null
pr: null
claim: "2026-07-16T18:11:12Z"
assignee: "converge-notifications-build-handle-onto-fanout"
blocked-by: null
closed-reason: null
---

## Context

PR #4906 (`converge-transaction-instrumenter-build-handle`) added
`Notifications.buildHandle` and `Notifications.instrumenter` to the static hub
(`packages/activesupport/src/notifications.ts`) so `TransactionInstrumenter`
could span a transaction with a real handle
(Rails' `ActiveSupport::Notifications.instrumenter.build_handle`,
`vendor/rails/activesupport/lib/active_support/notifications/instrumenter.rb:78-80`).

Because the static `Notifications` class is still a **separate reimplementation**
(it owns its own `_subscribers` Set, event stack, and `_notify`, rather than
delegating to `Fanout`), `buildHandle` had to **reimplement** Rails'
`Fanout::Handle` inline: it snapshots the matching subscribers at build time and
runs them under `iterateGuardingExceptions` at finish, duplicating the logic that
already lives in `Fanout::Handle` (`notifications/fanout.ts:218-252`,
`fanout.rb:227-262`). This is the same structural divergence tracked by
[[converge-notifications-onto-fanout-notifier]] for `Notifications.instrument`,
but that story predates #4906 and does not mention the handle/instrumenter
surfaces.

When the static hub is converged onto the `Fanout` notifier, the inline handle
in `Notifications.buildHandle` and the ad-hoc `Notifications.instrumenter`
object should be dropped in favor of delegating to `Fanout#buildHandle` /
`Wrapper#instrumenter`, so there is a single `Handle` implementation.

## Acceptance criteria

- [ ] `Notifications.buildHandle` delegates to the Fanout notifier's
      `buildHandle` (snapshotting groups via `groupsFor`) instead of
      reimplementing subscriber snapshotting + guarded iteration inline.
- [ ] `Notifications.instrumenter` returns a real `Instrumenter`/`Wrapper`
      backed by the shared Fanout, not an ad-hoc object literal.
- [ ] The inline `ArgumentError` state-guard duplication in `notifications.ts`
      is removed (single source in the Fanout `Handle`).
- [ ] `transaction-instrumentation.test.ts` and `notifications*.test.ts` keep
      passing; api:compare / test:compare delta non-negative.

Note: gated behind [[converge-notifications-onto-fanout-notifier]] landing — do
not start until the static hub actually delegates to Fanout.
