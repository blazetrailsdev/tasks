---
title: "action-controller-railtie-missing-initializers-and-set-helpers-path-after"
status: draft
updated: 2026-09-30
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

`packages/trailties/src/trailties/action-controller.ts` ports 4 of the 9 initializers in
`vendor/rails/v8.0.2/actionpack/lib/action_controller/railtie.rb`. trails#8281 put the ported
four in Rails' order. Still missing:

- `action_controller.assets_config` (`railtie.rb:26-28`), `group: :all`, which seeds
  `config.action_controller.assets_dir ||= app.config.paths["public"].first`.
- `action_controller.parameters_config` (`:34-51`), which sets `ActionController::Parameters`
  `permit_all_parameters`, `always_permitted_parameters` and `action_on_unpermitted_parameters`
  (`:log` when `Rails.env.local?`, else `false`).
- `action_controller.compile_config_methods` (`:96-100`).
- `action_controller.query_log_tags` (`:110-135`).
- `action_controller.test_case` (`:137-141`).

`action_controller.set_helpers_path` (`:30-32`) is ported with an invented
`{ after: "prepend_helpers_path" }` option. Rails' body is only
`ActionController::Helpers.helpers_path = app.helpers_paths`: it hands over the array itself,
and `prepend_helpers_path` (`railties/lib/rails/engine.rb:638`) fills it later in place. trails
also eagerly runs `ActionController.loadApplicationHelperNames()` / `setApplicationHelpers(...)`
and the `helperConstants` walk (`@noRailsEquivalent PERMANENT`) there. That needs the paths
already populated, which is why it forces the `after:`.

## Acceptance criteria

- [ ] The five missing initializers are ported in Rails' declaration order, each with its Rails body.
- [ ] `set_helpers_path` has no `after:` option, as `railtie.rb:30` has none. The eager helper
      loading moves to where Rails resolves `helper :all` (`ActionController::Helpers.all_helpers_from_path`,
      at `helpers_path` read time), or is justified as language-forced at the call site.
- [ ] The application's tsorted initializer order places each `action_controller.*` initializer
      where Rails' does.
