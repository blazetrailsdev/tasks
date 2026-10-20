---
title: "ViewReloader re-imports rebuilt template modules (cache_template_loading)"
status: draft
updated: 2026-10-20
rfc: "0176-actionview-helpers"
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

Follows `actionview-template-compile-loads-precompiled-module`. Rails decides whether templates reload with `config.action_view.cache_template_loading`, which defaults to `!reloading_enabled?` (`vendor/rails/v8.0.2/actionview/lib/action_view/railtie.rb:89-120`). In development, `CacheExpiry::ViewReloader` (`cache_expiry.rb:5`, `reload!` at `:33`) clears the template caches when watched files change.

trails: `packages/actionview/src/cache-expiry.ts`, and `packages/trails-tsc/src/watch-views.ts` rebuilds `.trails/views` on change.

## Acceptance criteria

- With reloading on, a watched view-file change rebuilds the compiled module and `ViewReloader#reload!` clears the caches. The next render re-imports the module (cache-busted). No `eval` is involved.
- With reloading off (production), templates load once from the deploy-time build.
- The `trails server` dev flow runs the view watcher, and the production boot/deploy docs say `trails-tsc build` is required.
