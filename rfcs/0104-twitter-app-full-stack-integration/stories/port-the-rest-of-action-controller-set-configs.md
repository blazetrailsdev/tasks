---
title: "action_controller.set_configs ports only its two routing lines"
status: ready
updated: 2026-09-04
rfc: "0104-twitter-app-full-stack-integration"
cluster: null
packages: []
deps: []
deps-rfc: []
est-loc: 180
priority: 30
pr: null
claim: null
assignee: null
blocked-by: null
closed-reason: null
---

## Context

PR 7439 declared `action_controller.set_configs`
(`vendor/rails/actionpack/lib/action_controller/railtie.rb:54-93`) in
`packages/trailties/src/trailties/action-controller.ts`, but only the two
routing lines of its `on_load(:action_controller)` block (`:69-70`):

```ruby
include app.routes.mounted_helpers
extend ::AbstractController::Railties::RoutesHelpers.with(app.routes)
```

The rest of the Ruby body is unported, and each line has a receiver that does
not exist yet:

- `:55-66` — `options.logger ||= Rails.logger`, `options.cache_store ||=
Rails.cache`, `javascripts_dir` / `stylesheets_dir` from
  `paths["public/javascripts"]` / `["public/stylesheets"]`, and
  `asset_host` / `relative_url_root` from `app.config`. The `public/*` path
  entries are not in trails' `Engine::Configuration#paths`.
- `:71` — `extend ::ActionController::Railties::Helpers`, whose module is
  unported.
- `:73` — `wrap_parameters format: [:json] if options.wrap_parameters_by_default`.
  `config.actionController.wrapParametersByDefault` is already seeded in this
  file; `wrap_parameters` itself is in
  `packages/actionpack/src/action-controller/params-wrapper.ts`.
- `:75-93` — the `filtered_options.each { |k, v| k = "#{k}="; send(k, v) ... }`
  setter dispatch over `options.except(...)`, which needs the config object to
  answer Rails' writer names.

The trailtie's own docblock records the omission; nothing else tracks it.

## Converged shape

Port the body line by line as each receiver lands, keeping Rails' order and
the `filtered_options` `except` list verbatim (`:79-86`). The
`wrap_parameters` arm is the one reachable today — `paramsWrapper` and the
config slot both exist — so it is the natural first slice.

## Acceptance criteria

- `wrap_parameters format: [:json]` runs under
  `config.actionController.wrapParametersByDefault`, guarded by the
  `respond_to?(:wrap_parameters)` check as Rails guards it (`:73`).
- The remaining unported lines are named in the trailtie docblock with the
  receiver each is waiting on, rather than as one undifferentiated sentence.
- `pnpm parity:api:calls` stays green.
