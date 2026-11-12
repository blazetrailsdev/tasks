---
title: "Port Turbo::Broadcastable's instance broadcast_* methods"
status: draft
updated: 2026-11-12
rfc: "0000-turbo-port"
cluster: turbo
packages: [turbo, activerecord]
deps: [turbo-broadcasts-and-streams-channel, turbo-dummy-test-app]
deps-rfc: []
est-loc: 400
priority: null
pr: null
claim: null
assignee: null
blocked-by: null
closed-reason: null
---

## Context

`vendor/turbo-rails/v2.0.23/app/models/concerns/turbo/broadcastable.rb:244-535`
is the instance side of the concern: every `broadcast_*`, `broadcast_*_later`
and `broadcast_*_to` method from `:244` to `:502`, and the private helpers
from `:507` (`broadcast_target_default`, `extract_options_and_add_target`,
`broadcast_rendering_with_defaults`, and the rest). Each one calls the
`Turbo::StreamsChannel` broadcast methods from
`turbo-broadcasts-and-streams-channel`. The class side is
`turbo-broadcastable-class-methods-and-callbacks`.

Tests: the instance-method arms of
`vendor/turbo-rails/v2.0.23/test/streams/broadcastable_test.rb` (the tests
that call `broadcast_*` directly on a record). They use the dummy app's
`Message`, `Article`, `Comment` and `Board` models from `test/dummy/app/models`.

## Acceptance criteria

- `Broadcastable` is an `ActiveSupport::Concern` port, and every instance
  method from `:244` to `:535` is present under its Rails name, private
  helpers marked `@internal`.
- The instance-method arms of `broadcastable_test.rb` are ported under their
  upstream names, against the dummy app's models and schema, ported verbatim.
  No bespoke tables are added.
