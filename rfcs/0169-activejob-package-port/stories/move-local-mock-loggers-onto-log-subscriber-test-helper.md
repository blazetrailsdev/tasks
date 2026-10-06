---
title: "Move the three hand-rolled MockLoggers onto ActiveSupport::LogSubscriber::TestHelper"
status: draft
updated: 2026-10-06
rfc: "0169-activejob-package-port"
cluster: null
packages: []
deps: []
deps-rfc: []
est-loc: 250
priority: null
pr: null
claim: null
assignee: null
blocked-by: null
closed-reason: null
---

## Context

`packages/activesupport/src/log-subscriber/test-helper.ts` now ports
`ActiveSupport::LogSubscriber::TestHelper`
(`vendor/rails/v8.0.2/activesupport/lib/active_support/log_subscriber/test_helper.rb:37-104`):
`setup` / `teardown` / `wait` / `setLogger` as `this`-typed functions and
`MockLogger` (`:54-89`). Three test files still hand-roll a `MockLogger`
instead of including the helper, where the Rails tests they mirror do
`include ActiveSupport::LogSubscriber::TestHelper`:

- `packages/activesupport/src/log-subscriber.test.ts:10` (Rails:
  `activesupport/test/log_subscriber_test.rb:27`). Its copy `extends Logger`,
  gates each level on `this.level`, and keeps `null` messages, none of which
  Rails' `MockLogger#method_missing` (`test_helper.rb:66-72`) does.
- `packages/activerecord/src/log-subscriber.test.ts` (Rails:
  `activerecord/test/cases/log_subscriber_test.rb:11`), whose `set_logger`
  override (`:33-35`) is `ActiveRecord::Base.logger = logger`.
- `packages/actionview/src/log-subscriber.trails.test.ts` (Rails:
  `actionview/test/activerecord/controller_runtime_test.rb` /
  `actionview/test/template/log_subscriber_test.rb:10`).

`MockLogger` spells its severity predicates `"debug?"` … `"unknown?"`, as
getters, because that is the spelling `Logger`, `BroadcastLogger` and
`LogSubscriber.LEVEL_CHECKS` (`packages/activesupport/src/log-subscriber.ts:44-48`)
read today. `0072/converge-log-subscriber-level-checks-to-rails-predicates` and
`0098/converge-broadcast-logger-level-and-predicate-delegates` own that
spelling; when they converge it, `MockLogger`'s generated predicates
(`test-helper.ts`, the `LOG_LEVELS` loop) move with them.

## Acceptance criteria

- [ ] The three local `MockLogger` classes are deleted and each file drives `setup` / `teardown` / `wait` from `log-subscriber/test-helper.ts`, overriding `setLogger` where the Rails test overrides `set_logger`.
- [ ] No test name changes; `pnpm parity:test` and `pnpm parity:test:assertions` deltas are non-negative for activesupport, activerecord and actionview.
- [ ] A test that passed only because the local copy gated on `level` or kept a `nil` message is fixed in the implementation, not by re-adding the copy.

## Definition of done

Keeping any local `MockLogger`, or wrapping the shared one in a per-file subclass that restores the old behaviour, does not close this story.
