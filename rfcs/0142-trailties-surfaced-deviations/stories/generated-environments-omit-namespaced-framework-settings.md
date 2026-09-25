---
title: "generated-environments-omit-namespaced-framework-settings"
status: ready
updated: 2026-09-25
rfc: "0142-trailties-surfaced-deviations"
cluster: null
packages: []
deps: []
deps-rfc: []
est-loc: null
priority: 1
pr: null
claim: null
assignee: null
blocked-by: null
closed-reason: null
---

## Context

The generated `config/environments/*.ts`
(`packages/trailties/src/generators/app-generator.ts`) mirror only the
top-level settings of Rails' templates. Every namespaced setting is left out:
`config.action_controller.*`, `config.active_record.*`,
`config.action_mailer.*`, `config.active_storage.service`,
`config.active_support.deprecation` / `report_deprecations`,
`config.active_job.*`, `config.i18n.fallbacks`,
`config.action_view.annotate_rendered_view_with_filenames`,
`config.action_dispatch.show_exceptions`
(`railties/lib/rails/generators/rails/app/templates/config/environments/{development,test,production}.rb.tt`).
Rails reaches these through `Railtie::Configuration#method_missing`
(`railties/lib/rails/railtie/configuration.rb:90-108`), and trails spells that
as `config.get("actionController")`, which returns `unknown`. The namespaces
trails registers are `actionController`, `actionView`, `actionDispatch`,
`activeRecord`, `activeModel` and `activeSupport` (`src/trailties/*.ts`
`this.config.set(...)`). `actionMailer`, `activeStorage`, `activeJob` and
`i18n` are not registered, so `get` raises `NoMethodError` for them.

Also left out:

- development.rb.tt's `if Rails.root.join("tmp/caching-dev.txt").exist?` block
- production.rb.tt's `config.logger = ActiveSupport::TaggedLogging.logger(STDOUT)`

## Acceptance criteria

- The generated environment files set every namespaced setting in the `.rb.tt`,
  each under the same `skip_*` / `options.api?` guard the template uses.
- Each namespace reads in a type-safe spelling that a Rails dev recognizes as
  `config.action_controller.x = y`, with no `as` cast in the generated file.
- The caching-dev toggle and the production logger are ported.
