---
title: "trailties-action-controller-load-hooks-run-after-app-initializers"
status: draft
updated: 2026-11-22
rfc: "0248-trailties-parity-100"
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

`vendor/rails/v8.0.5.2/railties/test/application/configuration_test.rb` tests that configure
`ActionController::Parameters` / `ActionController::Base` from an app initializer fail in trails:

- `:1597` "ActionController::Base.raise_on_open_redirects can be configured in the new framework defaults"
- `:1822` "config.action_controller.permit_all_parameters can be configured in an initializer"
- `:1835` "config.action_controller.always_permitted_parameters can be configured in an initializer"
- `:1848` "config.action_controller.action_on_unpermitted_parameters can be configured in an initializer"

`packages/trailties/lib/trailties/action-controller.ts` ports the `action_controller.parameters_config`
and `set_configs` initializers faithfully (`actionpack/lib/action_controller/railtie.rb:38-56`), but
their `ActiveSupport.on_load(:action_controller)` blocks run immediately because `ActionController::Base`
is already evaluated by an ES import before the app's `config/initializers/*` run. In Rails the hook
fires when `ActionController::Base` is first loaded, which is after the initializers. Observed:
`Parameters.permitAllParameters` stays `false`, `alwaysPermittedParameters` stays `["controller", "action"]`.

## Acceptance criteria

- [ ] An app initializer's `config.action_controller.*` assignment reaches `ActionController::Parameters` / `Base`, as in Rails.
- [ ] The four tests above are ported into `packages/trailties/test/application/configuration.test.ts` with their Rails names and pass.
