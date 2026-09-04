---
title: "railtie-configuration-app-middleware-and-generators-stubs"
status: claimed
updated: 2026-09-04
rfc: "0104-twitter-app-full-stack-integration"
cluster: null
packages: []
deps: []
deps-rfc: []
est-loc: 220
priority: 20
pr: null
claim: "2026-09-04T20:50:46Z"
assignee: "async-overrides-of-synchronous-rails-adapter-methods"
blocked-by: null
closed-reason: null
---

## Context

`Railtie::Configuration#app_middleware` and `#app_generators` return real
objects in Rails:

- `app_middleware` is `@@app_middleware ||= Rails::Configuration::MiddlewareStackProxy.new`
  (`railties/lib/rails/railtie/configuration.rb:39-41`), which records queued
  `use` / `insert_before` / `swap` operations that
  `Application#default_middleware_stack` later merges
  (`railties/lib/rails/application.rb`).
- `app_generators` is `@@app_generators ||= Rails::Configuration::Generators.new`
  (`:44-49`), yielded to a block when one is given.

trails' port returns `undefined` from both
(`packages/trailties/src/trailtie/configuration.ts`), with a comment saying they
are wired when `MiddlewareStackProxy` and the generators config surface land.

The consequence is already recorded next door: `Application#app`'s
`@missingRailsCall build_middleware` receipt (`packages/trailties/src/application.ts`)
says Rails merges `config.app_middleware + config.middleware` and trails cannot,
because there are no queued operations to merge.

## Converged shape

Port `Rails::Configuration::MiddlewareStackProxy`
(`railties/lib/rails/configuration.rb`) and have `appMiddleware` return one, so
`Application#app` can do the merge its receipt describes; the receipt is then
deleted rather than reworded. `appGenerators` follows the same shape once the
generators config surface exists — it may want splitting into its own story if
that surface is the larger half.

## Acceptance criteria

- [ ] `appMiddleware()` returns a `MiddlewareStackProxy` that records queued
      operations.
- [ ] `Application#app` merges `config.appMiddleware` into the default stack,
      and the `@missingRailsCall build_middleware` receipt is deleted.
- [ ] `appGenerators()` returns the generators config, or is split out with its
      own story if that surface is not yet ported.
- [ ] No stub returning `undefined` remains.
