---
title: "Event.children nesting is a non-Rails invention — triage keep vs remove"
status: ready
updated: 2026-07-16
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

trails' `ActiveSupport::Notifications::Event` carries a `children: Event[]`
field and both instrumentation paths maintain parent/child nesting:

- Instance `Instrumenter` (`packages/activesupport/src/notifications/instrumenter.ts`):
  a `_stack: Handle[]` is threaded into the wrapped `Handle`, whose `start()`
  links its event under the one still open above it (added by
  `converge-instrumenter-event-payload-dup`, PR #4903, specifically to preserve
  this feature through the `build_handle` reroute).
- Static `Notifications` (`packages/activesupport/src/notifications.ts`):
  `_eventStack()` (IsolatedExecutionState) + `_buildEvent` push each event onto
  its parent's `children`.

Rails' `Event`
(`vendor/rails/activesupport/lib/active_support/notifications/instrumenter.rb:106-143`)
has **no** `children` field and no nesting — the Fanout groups don't track it
either (`fanout.rb`). It is a trails invention. The only consumers are tests
(`packages/activesupport/src/notifications.test.ts` "tracks children for nested
instrumentation" and the static nesting assertions); no production code reads
`event.children`.

The nesting also forces the `Handle` stack-threading wart in #4903: the wrapped
`Handle` takes an optional `_stack` purely to reproduce this non-Rails behaviour.
Removing `children` lets `Handle` drop that parameter and the instance
`Instrumenter` drop `_stack` entirely.

## Acceptance criteria

- [ ] Decide (triage): keep `Event.children` as an intentional trails extension,
      or remove it to converge on Rails' childless `Event`.
- [ ] If removing: drop `children` from `Event`, the `_stack` threading in the
      instance `Instrumenter` / `Handle`, and the static `_eventStack`-based
      `children.push` in `_buildEvent`; delete or convert the children-nesting
      tests (they have no Rails counterpart to match).
- [ ] If keeping: document it as a deliberate deviation (e.g. an `@internal`
      note) so it isn't re-flagged.
- [ ] api:compare / test:compare delta non-negative.
