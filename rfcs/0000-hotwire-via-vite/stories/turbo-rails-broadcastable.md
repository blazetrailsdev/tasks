---
title: "Port Turbo::Broadcastable (the ActiveRecord concern)"
status: draft
updated: 2026-11-12
rfc: "0000-hotwire-via-vite"
cluster: turbo
packages: [turbo-rails, activerecord]
deps: [turbo-rails-broadcasts-and-streams-channel]
deps-rfc: []
est-loc: 700
priority: null
pr: null
claim: null
assignee: null
blocked-by: null
closed-reason: null
---

## Context

`vendor/turbo-rails/v2.0.23/app/models/concerns/turbo/broadcastable.rb:155-535` holds 42 methods.
`ClassMethods` covers `broadcasts_to` (`:183`), `broadcasts` (`:191`),
`broadcasts_refreshes_to` / `broadcasts_refreshes` (`:209-219`),
`suppressing_turbo_broadcasts` (`:227`) and `suppressed_turbo_broadcasts?`
(`:234`). The instance side covers every `broadcast_*` / `_later` / `_to`
method from `:244` to `:502`, and the private helpers start at `:507`. It is
included through `turbo.broadcastable`, `on_load(:active_record)` behind
`defined?(ActiveJob)` (`engine.rb:68-74`). Tests:
`vendor/turbo-rails/v2.0.23/test/streams/broadcastable_test.rb` (94). It uses the dummy app's
`Message`, `Article`, `Comment` and `Board` models from
`test/dummy/app/models`. Land what fits in one PR, and file the remainder.

## Acceptance criteria

- `Broadcastable` is an `ActiveSupport::Concern` port, included onto
  `ActiveRecord::Base` by the initializer. Its `after_create_commit`-family
  callbacks are wired as in `broadcasts_to`.
- `broadcastable_test.rb` is ported under its upstream names, against the
  dummy app's models and schema, ported verbatim. No bespoke tables are
  added.
