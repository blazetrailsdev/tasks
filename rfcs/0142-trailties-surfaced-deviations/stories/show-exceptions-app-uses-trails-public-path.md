---
title: "DefaultMiddlewareStack#show_exceptions_app passes Rails.public_path"
status: draft
updated: 2026-11-21
rfc: "0142-trailties-surfaced-deviations"
cluster: null
packages: []
deps: []
deps-rfc: []
est-loc: 30
priority: null
pr: null
claim: null
assignee: null
blocked-by: null
closed-reason: null
---

## Context

`Rails::Application::DefaultMiddlewareStack#show_exceptions_app`
(`vendor/rails/v8.0.2/railties/lib/rails/application/default_middleware_stack.rb:135-137`) is:

    config.exceptions_app || ActionDispatch::PublicExceptions.new(Rails.public_path)

trails' `_showExceptionsApp` (`packages/trailties/lib/application/default-middleware-stack.ts`) is:

    this.config.exceptionsApp ?? new PublicExceptions(this.paths.get("public")?.toAry()[0] ?? "/public")

It deviates in three ways:

- It passes `toAry()[0]`, the unexpanded, relative `"public"`, where Rails passes `Rails.public_path`.
  `Trails.publicPath()` (`packages/trailties/lib/trails.ts:147-150`) is already ported and expands it.
  trails#10521 fixed the same bug for `ActionDispatch::Static`'s root (`:34`, `paths["public"].first`).
- It adds an invented `?? "/public"` fallback.
- It uses `??` where Rails has `||`.

## Acceptance criteria

- [ ] The body is `this.config.exceptionsApp || new PublicExceptions(Trails.publicPath())`, matching `:136`.
- [ ] A test shows a 404 in production renders the app's `public/404.html`
      (e.g. `railties/test/application/middleware/exceptions_test.rb`).
