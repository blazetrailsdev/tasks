---
title: "Port the remaining Finisher initializers (setup_default_session_store, finisher_hook, ...)"
status: claimed
updated: 2026-08-31
rfc: "0104-twitter-app-full-stack-integration"
cluster: null
packages: []
deps: []
deps-rfc: []
est-loc: 350
priority: 20
pr: 7295
claim: "2026-08-31T21:45:19Z"
assignee: "session-and-flash-lifecycle"
blocked-by: null
closed-reason: null
---

## Context

`Finisher` declares seven of its initializers; Rails
(`vendor/rails/railties/lib/rails/application/finisher.rb`) declares
fourteen. After PR #6517 added `setup_main_autoloader` (`finisher.rb:17`) and
`set_routes_reloader_hook` (`:158`),
`packages/trailties/src/application/finisher.ts` still has none of:

- `setup_default_session_store` (`finisher.rb:49-54`) — runs
  `before: :build_middleware_stack` and sets
  `config.session_store :cookie_store, key: "_#{app_name}_session"` unless one
  is configured. `DefaultMiddlewareStack#buildStack`
  (`packages/trailties/src/application/default-middleware-stack.ts`) only uses
  `config.sessionStore` when truthy, so with this unported a booted app has no
  session middleware at all.
- `eager_load!` (`:75-88`) and `finisher_hook` (`:91`) — note
  `Application#initialize` currently fires the `after_initialize` hooks
  directly instead of through `finisher_hook`.
- `configure_executor_for_concurrency` (`:118-135`), including the
  `MonitorHook` / `InterlockHook` inner types.
- `set_clear_dependencies_hook` (`:182-`) and `enable_yjit`.

## Converged shape

- Each initializer above is declared on `Finisher` at its Rails name and in
  Rails declaration order (the `before: :build_middleware_stack` option on
  `setup_default_session_store` matters), with its Rails body — or is listed
  with a reason in the `finisher.ts` header comment where the subsystem is
  genuinely unported (YJIT has no JS analogue; the executor hooks need
  `ActiveSupport::Executor`).
- `setup_default_session_store` is the priority — it is the one whose absence
  changes the middleware stack a real app boots.
- `Application#initialize`'s direct `runLoadHooks("after_initialize", this)`
  moves into `finisher_hook` where Rails puts it.

Depends on `port-execution-wrapper-and-reloader` for the executor hooks.
