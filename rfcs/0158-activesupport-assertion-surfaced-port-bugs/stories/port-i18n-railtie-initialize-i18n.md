---
title: "port-i18n-railtie-initialize-i18n"
status: draft
updated: 2026-11-20
rfc: "0158-activesupport-assertion-surfaced-port-bugs"
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

`I18n::Railtie.initialize_i18n` (`vendor/rails/v8.0.2/activesupport/lib/active_support/i18n_railtie.rb:35-82`)
applies `config.i18n`. It runs from `config.after_initialize` and `before_eager_load` (`:16-30`), and it:

- deletes `:fallbacks` and `:enforce_available_locales`;
- loops over the settings (`railties_load_path`, `load_path`, `raise_on_missing_translations` through
  `setup_raise_on_missing_translations_config` at `:84-101`, and the `I18n.public_send("#{setting}=")` arm);
- calls `init_fallbacks(fallbacks) if fallbacks && validate_fallbacks(fallbacks)`;
- installs the file-watcher reloader when reloading is enabled.

trails#10394 ported `include_fallbacks_module`, `init_fallbacks` and `validate_fallbacks` onto `Trailtie` in
`packages/trailties/lib/trailties/i18n.ts`, but nothing reads `config.i18n` yet. Every `config.i18n.*`
setting is currently a no-op in a booted app.

## Acceptance criteria

- `Trailtie.initializeI18n(app)` is ported line for line, with `setupRaiseOnMissingTranslationsConfig` and
  `watchedDirsWithExtensions`, and is registered from `afterInitialize` / `beforeEagerLoad` as Rails does.
- The railties `test/application/initializers/i18n_test.rb` fallback cases run.
