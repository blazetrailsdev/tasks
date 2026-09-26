---
title: "i18n-railtie-initializers-unported"
status: ready
updated: 2026-09-26
rfc: "0142-trailties-surfaced-deviations"
cluster: null
packages: []
deps: []
deps-rfc: []
est-loc: null
priority: 6
pr: null
claim: null
assignee: null
blocked-by: null
closed-reason: null
---

## Context

`packages/trailties/src/trailties/i18n.ts` ports only the config seats of
`I18n::Railtie` (`activesupport/lib/active_support/i18n_railtie.rb:10-13`):
`config.i18n` with `railtiesLoadPath`, `loadPath` and `fallbacks`, so the
generated `config/environments/production.ts` can set
`this.config.i18n.fallbacks = true` (as `production.rb.tt` does).

The rest of the railtie is not ported, so every `config.i18n.*` setting is
stored and never applied:

- `config.eager_load_namespaces << I18n` (`i18n_railtie.rb:15`) — trailties does
  not depend on `@blazetrails/i18n`.
- the `before_eager_load` / `after_initialize` hooks calling
  `I18n::Railtie.initialize_i18n(app)` (`:19-29`).
- `initialize_i18n` (`:34-80`), `setup_raise_on_missing_translations_config`,
  `include_fallbacks_module`, `init_fallbacks`, `validate_fallbacks`,
  `watched_dirs_with_extensions` (`:82-130`).

## Acceptance criteria

- `I18n::Railtie`'s hooks and class methods are ported in
  `packages/trailties/src/trailties/i18n.ts` with Rails names and control flow.
- `this.config.i18n.fallbacks = true` in an app's environment file results in
  `I18n.fallbacks` being initialized, as `init_fallbacks` does.
- `config.i18n.loadPath` entries reach `I18n.loadPath`.
