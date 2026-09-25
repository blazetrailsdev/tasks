---
title: "port-remaining-action-controller-set-configs-lines"
status: ready
updated: 2026-09-25
rfc: "0142-trailties-surfaced-deviations"
cluster: null
packages: []
deps: []
deps-rfc: []
est-loc: null
priority: 4
pr: null
claim: null
assignee: null
blocked-by: null
closed-reason: null
---

## Context

`port-the-rest-of-action-controller-set-configs` ported the `wrap_parameters`
arm (`vendor/rails/actionpack/lib/action_controller/railtie.rb:73`) into
`packages/trailties/src/trailties/action-controller.ts`'s
`action_controller.set_configs` initializer. The rest of the Ruby body is still
unported. A docblock can't hold this list because `no-freeform-comments` strips
prose, so the list lives here. Each line and the receiver it is waiting on:

- `:55` `paths = app.config.paths`: `public/javascripts` / `public/stylesheets`
  are not entries in trails' `Engine::Configuration#paths`
  (`packages/trailties/src/engine/configuration.ts:45`).
- `:58` `options.logger ||= Rails.logger`: `actionController` config seed has no `logger` slot.
- `:59` `options.cache_store ||= Rails.cache`: no `Trails.cache`.
- `:61-62` `javascripts_dir` / `stylesheets_dir`: blocked on the `public/*` path entries above.
- `:65-66` `asset_host` / `relative_url_root` from `app.config`: no such seats on
  trails' `Application::Configuration`.
- `:71` `extend ::ActionController::Railties::Helpers`: module
  (`action_controller/railties/helpers.rb`) unported.
- `:76-93` `filtered_options.each { send("#{k}=", v) ... raise "Invalid option key: #{k}" }`
  over `options.except(...)`: today only `includeAllHelpers` is assigned by hand.
  Converge to the generic setter dispatch, using `rbObjRespondTo` the way
  `trailties/active-record.ts:159` does for `active_record.set_configs`.

## Acceptance criteria

- Each line above is ported in Rails order once its receiver exists. Keep the
  `except` list verbatim (`:79-86`).
- The hand-written `includeAllHelpers` assignment is replaced by the
  `filtered_options` dispatch.
