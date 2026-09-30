---
title: "action-controller-railtie-initializer-order-drags-set-configs-before-env"
status: done
updated: 2026-09-30
rfc: "0142-trailties-surfaced-deviations"
cluster: null
packages: []
deps: []
deps-rfc: []
est-loc: null
priority: null
pr: trails#8281
claim: "2026-09-30T16:13:14Z"
assignee: "action-controller-railtie-initializer-order-drags-set-configs-before-env"
blocked-by: null
closed-reason: null
---

## Context

`packages/trailties/src/trailties/action-controller.ts` defines
`action_controller.set_configs` **before** `action_controller.deprecator`.
Rails defines `deprecator` first (`vendor/rails/v8.0.2/actionpack/lib/action_controller/railtie.rb:22`),
then `assets_config` (`:26`), `set_helpers_path` (`:30`), `parameters_config` (`:34`),
`set_configs` (`:54`), `compile_config_methods` (`:96`), `request_forgery_protection` (`:102`).

`Initializable::ClassMethods#initializer` (`vendor/rails/v8.0.2/railties/lib/rails/initializable.rb:90`)
gives each initializer an implicit `after:` of the previous one in its class. So in trails
`deprecator` (which is `before: :load_environment_config`) gets `after: set_configs`, and
tsort drags `set_configs` ahead of `load_environment_config`: it is at index 4 of the
application's tsorted initializers, before `load_environment_config` (6) and before
`make_routes_lazy` (10).

Observable: every `config.action_controller.*` set in `config/environments/*.ts` is ignored.
The generated `config/environments/test.ts` sets `allowForgeryProtection = false`, but
`ActionController::Base.allowForgeryProtection` stays `true`, so on a fresh
`trails new` + `generate scaffold Post title:string body:text` + `pnpm test`, the
`should create/update/destroy post` tests get 422 `InvalidAuthenticityToken`.

Reordering the initializers to Rails' order fixes the forgery flag, but it also moves the
first `app.routes()` call to after `make_routes_lazy`. `routes()` is then a `LazyRouteSet`
whose url helpers are empty until routes load, so `IntegrationTest` copies an empty
helper module and all 7 scaffold controller tests fail with `t.postsUrl is not a function`.
So this story depends on `lazy-route-set-url-helpers-method-missing-module`.

## Acceptance criteria

- [ ] `action-controller.ts` declares its initializers in Rails' order (`railtie.rb:22-137`), `deprecator` first.
- [ ] A test boots an app whose environment file sets `config.actionController.allowForgeryProtection = false` and asserts `ActionController.Base.allowForgeryProtection === false` (fails on the current order).
- [ ] `trails new` + `generate scaffold Post title:string body:text` + `pnpm test` passes all generated tests.
