---
title: "require_message_pack runs before config/initializers; converge to after_initialize position"
status: draft
updated: 2026-10-21
rfc: "0142-trailties-surfaced-deviations"
cluster: null
packages: []
deps: []
deps-rfc: []
est-loc: 80
priority: null
pr: null
claim: null
assignee: null
blocked-by: null
closed-reason: null
---

## Context

trails#9171 made `active_support.require_message_pack`
(`packages/trailties/src/trailties/active-support.ts:88`) and
`action_dispatch.require_message_pack`
(`packages/trailties/src/trailties/action-dispatch.ts:115`) plain railtie
initializers, because `after: "finisher_hook"` dragged the Finisher chain ahead
of later railties. They now run before the application's
`load_config_initializers` (`packages/trailties/src/engine.ts:373`), so a
`message_serializer` / `cookies_serializer` naming message_pack set only in
`config/initializers` is not loaded at boot. Its first synchronous reader then
raises `LoadError`.

Rails reads `message_serializer` in a `config.after_initialize` block
(`vendor/rails/v8.0.2/activesupport/lib/active_support/railtie.rb:148-154`),
after config/initializers. It requires message_pack lazily from
`SerializerWithFallback.[]`
(`vendor/rails/v8.0.2/activesupport/lib/active_support/messages/serializer_with_fallback.rb:9-15`).
`after_initialize` hooks run through `run_load_hooks`, which cannot await
(`packages/trailties/src/application/finisher.ts:124-125`).

## Acceptance criteria

- The serializer-driven message_pack load happens after config/initializers,
  in Rails' `after_initialize` position: for example, the `finisher_hook`
  load hooks can await a returned promise. It must not use an `after:` that
  drags another chain forward through tsort.
- A boot test sets the serializer from a `config/initializers` file and
  asserts that `ActiveSupport::MessagePack` is seated after `Trails.initialize()`.
- The awaited-load section in `packages/activesupport/CLAUDE.md` drops the
  config/initializers caveat.
