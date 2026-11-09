---
title: "i18n-railtie-initialize-i18n-applies-config"
status: draft
updated: 2026-11-09
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

# I18n::Railtie.initialize_i18n applies config.i18n (available_locales and the rest)

## Context

`I18n::Railtie.initialize_i18n` (`vendor/rails/v8.0.2/activesupport/lib/active_support/i18n_railtie.rb`) copies each `config.i18n` setting onto `I18n` (`available_locales=`, `default_locale=`, `load_path`, fallbacks). `packages/trailties/lib/trailties/i18n.ts` only seeds `config.i18n` with `railtiesLoadPath`, `loadPath` and `fallbacks`, and nothing applies it. So `config.i18n.available_locales = %i[en ja]` in an initializer never reaches `I18n.availableLocales()`, which `packages/trailties/lib/templates/trails/mailers/email.html.tse:129` reads for the locale menu.

## Acceptance criteria

- `initialize_i18n` is ported at its Rails name and applies `config.i18n`'s settings, `availableLocales` included.
- "locale menu selects correct option" (`vendor/rails/v8.0.2/railties/test/application/mailer_previews_test.rb:580`) is ported into `packages/trailties/test/application/mailer-previews.test.ts` with `config/initializers/available-locales.ts`.
