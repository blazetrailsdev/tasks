---
title: "action-view-railtie-logger-and-collection-caching-initializers"
status: done
updated: 2026-09-28
rfc: "0142-trailties-surfaced-deviations"
cluster: null
packages: []
deps: []
deps-rfc: []
est-loc: null
priority: 6
pr: trails#8221
claim: "2026-09-28T16:27:29Z"
assignee: "scaffold-controller-passes-locals-instead-of-setting-ivars"
blocked-by: null
closed-reason: null
---

## Context

Rails' ActionView railtie registers an `action_view.logger` initializer
(`vendor/rails/v8.0.2/actionview/lib/action_view/railtie.rb:82-84`):

```ruby
initializer "action_view.logger" do
  ActiveSupport.on_load(:action_view) { self.logger ||= Rails.logger }
end
```

trails' `packages/trailties/src/trailties/action-view.ts` has no such
initializer, so `ActionView::Base.logger` (`packages/actionview/src/base.ts`,
`static logger: unknown = null`) is never seeded from `Trails.logger` in a
booted app. Surfaced in review of trails#8197, which ported the adjacent
`railtie.rb:74-80` send loop.

The `action_view.collection_caching` initializer (`railtie.rb:94-96`,
`PartialRenderer.collection_cache = app.config.action_controller.cache_store`)
is also unported and belongs in the same pass.

## Acceptance criteria

- `action-view.ts` registers `action_view.logger`, which assigns `Base.logger`
  from `Trails.logger` inside `onLoad("action_view")` only when it is unset.
- `action_view.collection_caching` is ported after `action_controller.set_configs`,
  or blocked with the specific reason.
- A trailtie test covers a booted app whose `Base.logger` ends up as `Trails.logger`.
