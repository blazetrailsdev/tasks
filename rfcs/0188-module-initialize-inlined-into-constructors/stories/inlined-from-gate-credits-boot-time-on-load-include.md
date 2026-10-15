---
title: "inlined-from-gate-credits-boot-time-on-load-include"
status: draft
updated: 2026-10-15
rfc: "0188-module-initialize-inlined-into-constructors"
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

`ActionView::Base`'s constructor (`packages/actionview/src/base.ts`) carries `this._routes = null;` at the `super()` position of `ActionView::Base#initialize` (`vendor/rails/v8.0.2/actionview/lib/action_view/base.rb:244-259`): it is `ActionDispatch::Routing::UrlFor#initialize` (`vendor/rails/v8.0.2/actionpack/lib/action_dispatch/routing/url_for.rb:111-114`), which a view reaches because the `action_view.setup_action_pack` initializer runs `ActionView::RoutingUrlFor.include(ActionDispatch::Routing::UrlFor)` inside `ActiveSupport.on_load(:action_controller)` (`vendor/rails/v8.0.2/actionview/lib/action_view/railtie.rb:98-102`).

The segment carries no `@inlinedFrom` tag because `pnpm parity:api:inlined` reds it: "names a module ActionView::Base does not include or prepend". `scripts/api-compare/extract-ruby-api.rb` (`process_include*`, `on_load_block?`, ~:1193-1290) records nothing inside an `on_load` block, and an explicit-receiver `X.include(Y)` is not read at all, so `ActionView::RoutingUrlFor`'s ancestry in `rails-api.json` never has `Routing::UrlFor`.

## Acceptance criteria

- The extractor records an explicit-receiver `Const.include(Mod)` in an `on_load` block as an include of `Mod` into `Const` (or the inlined-from gate reads a separate boot-include list), without crediting `Mod`'s methods anywhere Rails does not put them.
- `ActionView::Base`'s constructor carries `@inlinedFrom ActionDispatch::Routing::UrlFor#initialize …` and `pnpm parity:api:inlined` is green.
