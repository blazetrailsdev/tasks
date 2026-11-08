---
title: "I18n::Railtie config.i18n is OrderedOptions with typed setter keys"
status: draft
updated: 2026-11-08
rfc: "0142-trailties-surfaced-deviations"
cluster: null
packages: []
deps: []
deps-rfc: []
est-loc: 60
priority: null
pr: null
claim: null
assignee: null
blocked-by: null
closed-reason: null
---

## Context

Rails' `config.i18n` is an `ActiveSupport::OrderedOptions`, and `config.i18n.fallbacks` is a nested `OrderedOptions` (`vendor/rails/v8.0.2/activesupport/lib/active_support/i18n_railtie.rb:10-13`). `initialize_i18n` iterates over every key with `I18n.public_send("#{setting}=", value)` (`:51-62`), so `backend`, `default_locale`, `enforce_available_locales` and so on are all valid keys. trails' `packages/trailties/src/trailties/i18n.ts` types `I18nConfig` as only `{ railtiesLoadPath, loadPath, fallbacks: boolean | string[] | Record }` and seeds `fallbacks: {}`. Because of that, `packages/trailties/src/application/initializers/i18n.test.ts` (trails#9852) has to cast `I18nRailtie.config.i18n as unknown as Record<string, unknown>` to set `fallbacks.defaults`, `fallbacks.map` and `backend` (`i18n_test.rb:240-280`).

## Acceptance criteria

- `config.i18n` and `config.i18n.fallbacks` are `OrderedOptions` instances, as in Rails.
- `I18nConfig` types `fallbacks` as boolean, array, Hash or `OrderedOptions`, and admits the `I18n` setter keys (`backend`, `defaultLocale`, `enforceAvailableLocales`, ...).
- The casts in `i18n.test.ts` are removed.
