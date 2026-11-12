---
title: "Port Turbo::StreamsChannel, Streams::Broadcasts, the broadcast jobs and debouncers"
status: draft
updated: 2026-11-12
rfc: "0000-turbo-rails-port"
cluster: turbo-rails
packages: [turbo-rails, actioncable]
deps: [turbo-rails-streams-tag-builder, turbo-rails-dummy-test-app]
deps-rfc: []
est-loc: 500
priority: null
pr: null
claim: null
assignee: null
blocked-by: null
closed-reason: null
---

## Context

- `vendor/turbo-rails/v2.0.23/app/channels/turbo/streams_channel.rb:34-45` (`subscribed`).
- `Turbo::Streams::StreamName` (`streams/stream_name.rb`) is already ported
  by `turbo-rails-package-helpers-and-turbo-stream-format`. This story
  `extend`s it.
- `streams/broadcasts.rb:5-127`: 23 `broadcast_*_to` / `_later_to` methods,
  plus `refresh_debouncer_for` and `render_broadcast_action`.
- `app/jobs/turbo/streams/action_broadcast_job.rb`, `broadcast_job.rb` and
  `broadcast_stream_job.rb`.
- `app/models/turbo/debouncer.rb`, `thread_debouncer.rb` and
  `immediate_debouncer.rb`.
- Tests: `vendor/turbo-rails/v2.0.23/test/streams/streams_channel_test.rb` (25).

## Acceptance criteria

- `Turbo::StreamsChannel` subclasses the trails `ActionCable::Channel::Base`
  and `extend`s `Broadcasts` and `StreamName`, as the Ruby does.
- `ThreadDebouncer` is ported using the settled trails timer and
  thread-isolation idioms. `turbo.test_assertions` swaps in
  `ImmediateDebouncer` for tests (`engine.rb:94-104`).
- `streams_channel_test.rb` is ported under its upstream names.
