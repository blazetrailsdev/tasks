---
title: "port-setup-default-session-store"
status: draft
updated: 2026-08-31
rfc: "0104-twitter-app-full-stack-integration"
cluster: null
packages: []
deps: []
deps-rfc: []
est-loc: null
priority: null
pr: null
claim: null
assignee: null
blocked-by: null
closed-reason: null
---

## Context

`Finisher`'s `setup_default_session_store` (`vendor/rails/railties/lib/rails/application/finisher.rb:48-54`)
is the one remaining finisher initializer with a real subsystem behind it that
trails cannot boot today. It runs `before: :build_middleware_stack` and sets
`config.session_store :cookie_store, key: "_#{app_name}_session"` unless one is
configured, which is what makes `DefaultMiddlewareStack#build_stack`
(`default_middleware_stack.rb:76-81`) mount a session store at all.

The config half is ported by the PR that filed this story:

- `Rails::Application::Configuration#session_store` / `#session_store?`
  (`vendor/rails/railties/lib/rails/application/configuration.rb:543-561`) are
  `sessionStore()` / `sessionStoreQ()` on
  `packages/trailties/src/application/configuration.ts`.
- `ActionDispatch::Session.resolve_store` (`vendor/rails/actionpack/lib/action_dispatch.rb:113-124`)
  is `packages/actionpack/src/action-dispatch/middleware/session/resolve-store.ts`.
- `DefaultMiddlewareStack#buildStack` now calls the reader, as Rails does.

What blocks the initializer itself is the request cycle, not the config:
`Rack::Session::Abstract::Persisted#call` / `#context` are unported. The trails
`Persisted` stand-in
(`packages/actionpack/src/action-dispatch/middleware/session/abstract-store.ts:71-98`)
defines only `generateSid` / `loadSession` / `extractSessionId` /
`commitSession`, all raising `NotImplementedError`, and `AbstractStore` has no
`call`. So a `CookieStore` mounted by `build_stack` fails with
`mw.call is not a function` (`middleware/stack.ts:172`) on the first request —
verified against the `boot-app` fixture in
`packages/trailties/src/application.test.ts`.

Rack is not vendored under `vendor/rack` for the session middleware
(`find vendor/rack -path '*session*'` is empty), so the port needs the Rack
source added first.

The initializer is currently listed with this reason in the header comment of
`packages/trailties/src/application/finisher.ts`, and
`finisher.test.ts`'s "does not register the intentionally skipped initializers"
asserts its absence.

## Acceptance criteria

- `Rack::Session::Abstract::Persisted#call` / `#context` ported so a
  `CookieStore` mounted by `DefaultMiddlewareStack` serves a request.
- `Finisher.initializer("setup_default_session_store", { before: "build_middleware_stack" }, ...)`
  declared at its Rails position (between `setup_main_autoloader` and
  `build_middleware_stack`), with Rails' body — the `railtie_name.chomp("_application")`
  app name and the `_#{app_name}_session` key.
- Removed from the header comment's unported register and from
  `finisher.test.ts`'s skipped list.
- The `boot-app` fixture integration test in `application.test.ts` stays green
  with a session store in the stack.
