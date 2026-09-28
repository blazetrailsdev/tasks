---
title: "action-view-collection-caching-initializer"
status: draft
updated: 2026-09-28
rfc: "0142-trailties-surfaced-deviations"
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

Split out of `action-view-railtie-logger-and-collection-caching-initializers` (trails#8221), which ported `action_view.logger`.

Rails' ActionView railtie registers
(`vendor/rails/v8.0.2/actionview/lib/action_view/railtie.rb:94-96`):

```ruby
initializer "action_view.collection_caching", after: "action_controller.set_configs" do |app|
  PartialRenderer.collection_cache = app.config.action_controller.cache_store
end
```

`packages/trailties/src/trailties/action-view.ts` has no such initializer. It is blocked on the receiver:
trails' `ActionControllerConfig` (`packages/trailties/src/trailties/action-controller.ts`) has no
`cacheStore` seat, and `action_controller.set_configs` does not yet port
`options.cache_store ||= Rails.cache` (`actionpack/lib/action_controller/railtie.rb:59`, tracked by
`port-remaining-action-controller-set-configs-lines`; trails has no `Trails.cache`). The setter
already exists: `setCollectionCache` in
`packages/actionview/src/renderer/partial-renderer/collection-caching.ts`.

## Acceptance criteria

- `action-view.ts` registers `action_view.collection_caching` with `{ after: "action_controller.set_configs" }`,
  assigning `PartialRenderer`'s collection cache from `app.config.actionController.cacheStore`.
- A trailtie test covers a booted app whose collection cache is the configured action controller cache store.
