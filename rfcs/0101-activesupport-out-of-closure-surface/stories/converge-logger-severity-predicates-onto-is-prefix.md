---
title: 'Logger severity predicates are string-named "debug?" getters instead of isDebug'
status: draft
updated: 2026-10-06
rfc: "0101-activesupport-out-of-closure-surface"
cluster: null
packages: []
deps: []
deps-rfc: []
est-loc: 300
priority: null
pr: null
claim: null
assignee: null
blocked-by: null
closed-reason: null
---

## Context

Surfaced in review of trails#8565. CLAUDE.md spells a Ruby predicate `foo?` as
`isFoo` and never as a string-named `"foo?"` member, but the logger severity
predicates are quoted-literal getters everywhere:

- `packages/activesupport/src/logger.ts` (`get "debug?"` … `get "fatal?"`),
  Ruby's `Logger#debug?` and `logger_thread_safe_level.rb`.
- `packages/activesupport/src/broadcast-logger.ts`
  (`vendor/rails/v8.0.2/activesupport/lib/active_support/broadcast_logger.rb:167-213`).
- `packages/rack/src/null-logger.ts` (`get "info?"`, `get "debug?"`).
- `packages/activesupport/src/log-subscriber/test-helper.ts`, `MockLogger`'s
  six generated predicates
  (`vendor/rails/v8.0.2/activesupport/lib/active_support/log_subscriber/test_helper.rb:82-88`),
  which carry `@noRailsEquivalent CONVERGEABLE` receipts pointing at this story.

Readers: `LogSubscriber.LEVEL_CHECKS`
(`packages/activesupport/src/log-subscriber.ts:44-48`, Rails
`log_subscriber.rb:86-90`), `packages/actionview/src/log-subscriber.ts`,
`packages/activesupport/src/testing/tagged-logging.ts:22`, and
`BroadcastLogger`'s own delegates. `packages/activesupport/src/cache/store.ts:447`
already reads `Store.logger?.isDebug?.()`, which no logger answers today.

`0072/converge-log-subscriber-level-checks-to-rails-predicates` (trails#6321)
and `0098/retire-logger-enabled-predicate-aliases` settled on the literal
spelling at the time; this story moves all of it onto the `is*` convention in
one sweep, since a logger and its readers must agree.

## Acceptance criteria

- [ ] `Logger`, `BroadcastLogger`, rack's `NullLogger` and `MockLogger` answer `isDebug()` … `isFatal()` (`isUnknown()` on `MockLogger`), and no `"x?"` member remains on any of them.
- [ ] `LEVEL_CHECKS` is `!logger.isDebug()` etc., and every other reader is migrated; `grep -rn '"debug?"' packages/*/src` is empty outside tests that quote the Ruby name.
- [ ] `MockLogger`'s six predicate receipts are deleted, and `pnpm parity:api:predicates`, `parity:api:extra:gate` and `parity:api` deltas are non-negative.

## Definition of done

Adding `isDebug` beside the literal getter, or re-pointing the receipts at another story, does not close this story.
