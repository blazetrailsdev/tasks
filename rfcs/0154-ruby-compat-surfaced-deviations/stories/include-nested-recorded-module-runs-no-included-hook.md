---
title: "include-nested-recorded-module-runs-no-included-hook"
status: draft
updated: 2026-11-12
rfc: "0154-ruby-compat-surfaced-deviations"
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

`rbModAppendFeatures` (`packages/ruby-compat/lib/include.ts`, the
`moduleIncludesKey` loop) applies a module's recorded nested includes with a
full `include(klass, nested)`. That runs the nested module's `appendFeatures` /
`included` hook with the class as the base. Ruby's `include_modules_at`
(`vendor/ruby/v3.3.11/class.c:1253`) only inserts the nested module's method
table and calls no hook. In Ruby, `class K; include M; end`, where `M` includes
`N`, never runs `N.included(K)`.

Observed in trails#10019. `ActionView::RoutingUrlFor` includes
`ActionDispatch::Routing::UrlFor`
(`actionview/lib/action_view/railtie.rb`), so every class that later includes
`RoutingUrlFor` re-runs `UrlFor`'s `included` block
(`actionpack/lib/action_dispatch/routing/url_for.rb:96-107`). That block adds a
`default_url_options` class attribute and includes `_url_for_modules`, where
Rails runs it once, with `RoutingUrlFor` as the base.

## Acceptance criteria

- A nested recorded include is appended with `rbModAppendFeatures` (method
  table only). A `Concern` dependency still goes through
  `Concern#append_features` (root CLAUDE.md § "A Ruby module is a JS object or a
  JS class").
- A ruby-compat test: `M` includes `N`, where `N` has an `included` hook; then
  `include(K, M)` does not call `N`'s hook with `K`.
