---
title: "Port Turbo::Broadcastable::ClassMethods, the commit callbacks and suppression"
status: draft
updated: 2026-11-12
rfc: "0000-turbo-port"
cluster: turbo
packages: [turbo, activerecord]
deps: [turbo-broadcastable-instance-broadcasts]
deps-rfc: []
est-loc: 350
priority: null
pr: null
claim: null
assignee: null
blocked-by: null
closed-reason: null
---

## Context

`vendor/turbo-rails/v2.0.23/app/models/concerns/turbo/broadcastable.rb:155-243`
is `ClassMethods`: `broadcasts_to` (`:183`), `broadcasts` (`:191`),
`broadcasts_refreshes_to` / `broadcasts_refreshes` (`:209-219`),
`suppressing_turbo_broadcasts` (`:227`) and `suppressed_turbo_broadcasts?`
(`:234`). They wire `after_create_commit`, `after_update_commit` and
`after_destroy_commit` onto the instance methods from
`turbo-broadcastable-instance-broadcasts`. The concern is included
through the `turbo.broadcastable` initializer, `on_load(:active_record)`
behind `defined?(ActiveJob)` (`lib/turbo/engine.rb:68-74`).

Tests: the remaining arms of
`vendor/turbo-rails/v2.0.23/test/streams/broadcastable_test.rb` (the
`broadcasts_to`, `broadcasts`, `broadcasts_refreshes` and suppression tests).
Between them, this story and the instance story cover all 94 tests in the
file.

## Acceptance criteria

- `turbo.broadcastable` includes `Broadcastable` onto `ActiveRecord::Base`
  through `onLoad("active_record")`, behind the ActiveJob check.
- The callbacks are registered by `broadcasts_to` / `broadcasts` exactly as
  the Ruby registers them, and suppression is thread-local per the settled
  trails `thread_mattr` idiom.
- The remaining arms of `broadcastable_test.rb` are ported under their
  upstream names.

## Verification

- `pnpm vitest run packages/turbo/test/streams/broadcastable.test.ts`
  runs all 94 upstream tests, none skipped.
