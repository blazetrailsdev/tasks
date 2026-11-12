---
title: "Port turbo-rails Engine, turbo_stream MIME and renderer, view helpers"
status: draft
updated: 2026-11-12
rfc: "0000-turbo-rails-port"
cluster: turbo-rails
packages: [turbo-rails]
deps: [turbo-rails-dummy-test-app]
deps-rfc: []
est-loc: 450
priority: null
pr: null
claim: null
assignee: null
blocked-by: null
closed-reason: null
---

## Context

- `vendor/turbo-rails/v2.0.23/lib/turbo/engine.rb:4-152`: `isolate_namespace`, `config.turbo`, and
  the initializers `turbo.helpers` (`:55`), `turbo.mimetype` (`:76-78`,
  `Mime::Type.register "text/vnd.turbo-stream.html", :turbo_stream`),
  `turbo.renderer` (`:80-85`, `ActionController::Renderers.add
:turbo_stream`), `turbo.configs` (`:49`) and `turbo.signed_stream_verifier_key`
  (`:87-92`). `turbo.assets` (`:43-47`) is a no-op with no `config.assets`, so
  it is ported as written.
- `vendor/turbo-rails/v2.0.23/lib/turbo-rails.rb:1-29`: the `Turbo` module attributes.
- Helpers: `app/helpers/turbo/drive_helper.rb` (9 methods),
  `frames_helper.rb:41` (`turbo_frame_tag`), `includes_helper.rb:4`,
  `streams_helper.rb:27,56` (`turbo_stream`, `turbo_stream_from`) and
  `streams/action_helper.rb:28,44,49`.
- Tests: `vendor/turbo-rails/v2.0.23/test/drive/drive_helper_test.rb`,
  `frames/frames_helper_test.rb`, `streams/action_helper_test.rb`,
  `streams/streams_helper_test.rb`, `initializers/helpers_test.rb` and
  `streams/streams_controller_test.rb`.

`turbo_stream_from` renders `<turbo-cable-stream-source>` with a signed
stream name, so this story also ports
`app/channels/turbo/streams/stream_name.rb:5-31` (`signed_stream_name`,
`verified_stream_name`) and the `turbo.signed_stream_verifier_key`
initializer. `turbo-rails-broadcasts-and-streams-channel` extends it.

## Acceptance criteria

- `packages/turbo-rails` mirrors `lib/turbo` plus the `app/*/turbo`
  dirs mapped in `vendor/sources.ts`. `compareApi` and `compareTests` are on.
- `Mime[:turbo_stream]` is registered, and `render turbo_stream: html` sets
  the content type, as the Rails renderer does.
- The listed helper tests are ported under their upstream names, against the dummy app from `turbo-rails-dummy-test-app`.
