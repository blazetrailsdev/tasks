---
title: "Port the I18n facade and interpolation"
status: draft
updated: 2026-07-26
rfc: "0074-i18n-parity"
cluster: null
deps: ["i18n-backend-base-simple"]
deps-rfc: []
est-loc: 450
priority: 3
pr: null
claim: null
assignee: null
blocked-by: null
closed-reason: null
---

# Port the I18n facade (translate/localize/with_locale) + interpolation

## Context

- `vendor/i18n/lib/i18n.rb:55-465` — `I18n::Base`: `config`, `translate`
  (`:default` array chains, `:throw`/`:raise`, reserved-key stripping,
  `translate_key`), `translate!`, `exists?`, `localize`, `with_locale`,
  `normalize_keys`/`normalize_key` (separator cache), `locale_available?`,
  `enforce_available_locales!`, `handle_exception`
  (default/`:raise`/`:throw`/callable), `interpolation_keys`.
- `vendor/i18n/lib/i18n/interpolate/ruby.rb` — `I18n.interpolate` /
  `interpolate_hash` with `INTERPOLATION_PATTERNS` (`%{key}` and
  `%<key>format`), `MissingInterpolationArgument` /
  `ReservedInterpolationKey` raising.

The AM/AR callers this must satisfy:
`vendor/rails/activemodel/lib/active_model/error.rb:58,86,100`,
`vendor/rails/activemodel/lib/active_model/translation.rb:80`,
`vendor/rails/activemodel/lib/active_model/naming.rb:204`. Depends on the
backend story.

## Acceptance criteria

- `packages/i18n/src/i18n.ts` (facade) + `packages/i18n/src/interpolate/ruby.ts`
  mirror the gem files; module-level singleton config like the gem's
  `I18n.config`.
- `:default` chains resolve in order with symbol re-lookup vs string literal
  semantics matching `base.rb`'s `default`.
- Exception-handler contract matches `handle_exception` arms (raise, throw,
  callable, default handler returning the missing-translation message).
- Unit tests mirror `vendor/i18n/test/i18n_test.rb` shapes with identical
  names.
