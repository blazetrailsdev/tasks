---
title: "include-abstract-controller-caching-into-action-controller-base"
status: draft
updated: 2026-09-05
rfc: "0129-ruby-compat"
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

`AbstractController::Caching`
(`vendor/rails/actionpack/lib/abstract_controller/caching.rb`) is ported —
`packages/actionpack/src/abstract-controller/caching.ts` exports
`readFragment`, `writeFragment`, `fragmentExist`, `expireFragment`,
`combinedFragmentCacheKey`, `viewCacheDependency`, `viewCacheDependencies` and
`ConfigMethods` — but the module is never included into a controller:
`grep -rn readFragment packages/actionpack/src` finds only the barrel re-export
at `abstract-controller/index.ts:64` and the log subscriber. Nothing assigns any
of it onto `ActionController::Base.prototype`, where Rails gets it from
`AbstractController::Caching` (`action_controller/base.rb`'s MODULES list, via
`caching.rb:30-46`'s `included do ... end`).

Surfaced by the `port-actionview-cache-helper` PR. `CacheHelper#cache` calls
`controller.perform_caching`, `controller.read_fragment` and
`controller.write_fragment` (`cache_helper.rb:177,289,294`), and
`digest_path_from_template` (`:257`) calls `view_cache_dependencies`, which
`caching.rb:45` publishes to the view with `helper_method`. That
`helperMethod(Base, "viewCacheDependencies")` registration now exists at
`action-controller/base.ts:881-886`, but its view-side delegator throws
`helper_method: controller does not respond to 'viewCacheDependencies'` until
the module is actually included.

## Acceptance criteria

- [ ] `AbstractController::Caching`'s instance methods and `ConfigMethods` are
      mixed into `ActionController::Base` the way Rails' MODULES list does.
- [ ] The `helperMethod` registration for `viewCacheDependencies` moves to the
      include site, so it cannot be registered without the method it delegates
      to — Rails keeps both inside the same `included do` block.
- [ ] An inline template calling `cache` in a controller with `performCaching`
      and a `cacheStore` emits `read_fragment.action_controller` /
      `write_fragment.action_controller`.
