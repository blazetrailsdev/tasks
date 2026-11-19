---
title: "i18n-railtie-initialize-i18n-applies-config"
status: blocked
updated: 2026-11-19
rfc: "0142-trailties-surfaced-deviations"
cluster: null
packages: []
deps:
  - i18n-railtie-initializers-unported
deps-rfc: []
est-loc: null
priority: null
pr: null
claim: "2026-11-19T14:46:37Z"
assignee: "health-controller-is-not-importable-from-trailties"
blocked-by: "initialize_i18n runs from after_initialize/before_eager_load load hooks, which runLoadHooks executes synchronously, while I18n.load_path= (config.ts setLoadPath -> backend.reloadBang) is async; porting it needs the hook to await. Same work as i18n-railtie-initializers-unported (RFC 0142), which owns porting the railtie's initializers."
closed-reason: null
---

# I18n::Railtie.initialize_i18n applies config.i18n (available_locales and the rest)

## Context

`I18n::Railtie.initialize_i18n` (`vendor/rails/v8.0.2/activesupport/lib/active_support/i18n_railtie.rb`) copies each `config.i18n` setting onto `I18n` (`available_locales=`, `default_locale=`, `load_path`, fallbacks). `packages/trailties/lib/trailties/i18n.ts` only seeds `config.i18n` with `railtiesLoadPath`, `loadPath` and `fallbacks`, and nothing applies it. So `config.i18n.available_locales = %i[en ja]` in an initializer never reaches `I18n.availableLocales()`, which `packages/trailties/lib/templates/trails/mailers/email.html.tse:129` reads for the locale menu.

## Acceptance criteria

- `initialize_i18n` is ported at its Rails name and applies `config.i18n`'s settings, `availableLocales` included.
- "locale menu selects correct option" (`vendor/rails/v8.0.2/railties/test/application/mailer_previews_test.rb:580`) is ported into `packages/trailties/test/application/mailer-previews.test.ts` with `config/initializers/available-locales.ts`.
