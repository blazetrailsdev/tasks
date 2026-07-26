---
rfc: "0074-i18n-parity"
title: "i18n gem parity"
status: draft
created: 2026-07-26
updated: 2026-07-26
owner: "@your-handle"
packages:
  - "i18n"
  - "activesupport"
  - "activemodel"
  - "activerecord"
clusters: []
---

# i18n gem parity

Drive the Ruby **i18n** gem (vendored at `vendor/i18n`, `ruby-i18n/i18n`
v1.14.8 — PR #5347) to Rails parity/fidelity, replacing today's scattered
trails shims with a real `packages/i18n` that mirrors the gem's layout and is
enrolled in `api:compare` / `test:compare`.

## Why

Rails 8.0.2 depends on `i18n (>= 1.6, < 2)`; every AR/AM error message,
`human_attribute_name`, and `model_name.human` call flows through it. Trails
currently fakes this with two **divergent** hand-rolled implementations —
`packages/activesupport/src/i18n.ts` (439 lines, its own `SimpleBackend`) and
`packages/activemodel/src/i18n.ts` (381 lines, its own translation store) —
plus satellites (`packages/activemodel/src/translation.ts`,
`packages/activerecord/src/translation.ts`,
`packages/activesupport/src/html-safe-translation.ts`). None of them map onto
the gem's file layout, so api-compare cannot measure them and drift is
invisible.

## TS home decision (crux from PR #5347)

Option (a): a new `packages/i18n` mirroring `vendor/i18n/lib/i18n/`, with the
scattered shims consolidated onto it. Mapping onto activesupport was rejected
(charges a foreign gem's surface to activesupport's numbers and strands the
activemodel half); vendor-only (option c) is the shipped interim state —
`compareApi: false` / `compareTests: false` in `vendor/sources.ts`, flipped on
by this RFC's enrollment stories.

## AR/AM-critical surface (port first)

Traced from the Rails side — `vendor/rails/activemodel/lib/active_model/error.rb:58,86,100`
(`generate_message`, `full_message` default chains),
`.../active_model/translation.rb:80` (`human_attribute_name`),
`.../active_model/naming.rb:204` (`model_name.human`),
`vendor/rails/activerecord/lib/active_record/translation.rb` (lookup ancestry +
`i18n_scope :activerecord`), and
`vendor/rails/activesupport/lib/active_support/html_safe_translation.rb`:

- **Facade** `vendor/i18n/lib/i18n.rb`: `translate`/`t` (incl. `:default`
  arrays, `:throw`/`:raise`, reserved keys), `translate!`, `exists?`,
  `with_locale`, `locale`/`default_locale`, `normalize_keys`,
  `handle_exception`; `localize` for AS date/time formats.
- **Config** `vendor/i18n/lib/i18n/config.rb`: `locale`, `backend`,
  `default_locale`, `available_locales`, `default_separator`,
  `exception_handler`, `load_path`, `enforce_available_locales`,
  `missing_interpolation_argument_handler`.
- **Backend** `vendor/i18n/lib/i18n/backend/base.rb` +
  `backend/simple.rb`: `store_translations`, `lookup`, `resolve`, `default`,
  `pluralize` (one/other + CLDR keys AR uses via `count:`), `translate`.
- **Interpolation** `vendor/i18n/lib/i18n/interpolate/ruby.rb` +
  `vendor/i18n/lib/i18n/utils.rb` (`deep_merge`).
- **Exceptions** `vendor/i18n/lib/i18n/exceptions.rb`: `MissingTranslation`,
  `MissingTranslationData`, `InvalidLocale`, `MissingInterpolationArgument`,
  `ReservedInterpolationKey`, `InvalidPluralizationData`.

## Deferrable surface (exclude/allowlist, later or never)

`backend/{chain,fallbacks,key_value,cache,cache_file,cascade,gettext,
interpolation_compiler,lazy_loadable,memoize,metadata,pluralization}.rb`,
`gettext/*`, `locale/tag/*` + `locale/fallbacks.rb`, `middleware.rb`,
`backend/transliterator.rb` (only AS `transliterate` touches it). Use the
existing unported-files / exclusion mechanisms with reasons, same as other
packages.

## Constraints

- Each PR ≤ 500 LOC; one story per PR; PRs branch from `main`, no stacking.
- Ported code lives in the file matching the gem's layout so api-compare
  resolves it; `@internal` for private helpers per CONTRIBUTING.md.
- Test names must match the gem's test names for test-compare matching.
